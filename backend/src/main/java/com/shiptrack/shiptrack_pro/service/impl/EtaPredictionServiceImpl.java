package com.shiptrack.shiptrack_pro.service.impl;

import com.shiptrack.shiptrack_pro.dto.EtaPredictionResponse;
import com.shiptrack.shiptrack_pro.entity.EtaPrediction;
import com.shiptrack.shiptrack_pro.entity.Route;
import com.shiptrack.shiptrack_pro.entity.Shipment;
import com.shiptrack.shiptrack_pro.entity.TrackingEvent;
import com.shiptrack.shiptrack_pro.repository.EtaPredictionRepository;
import com.shiptrack.shiptrack_pro.repository.RouteRepository;
import com.shiptrack.shiptrack_pro.repository.ShipmentRepository;
import com.shiptrack.shiptrack_pro.repository.TrackingEventRepository;
import com.shiptrack.shiptrack_pro.service.EtaPredictionService;
import com.shiptrack.shiptrack_pro.service.NotificationService;
import com.shiptrack.shiptrack_pro.service.NotificationType;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

/**
 * ETA Prediction Module - a simple, explainable rules-based model (deliberately not a
 * black-box ML model, so every point on the risk score can be read straight off the
 * `factors` string). Reads distanceKm/estimatedTimeMinutes/trafficCondition from the
 * shipment's most recent Route, and its own tracking-event history, then applies a fixed
 * set of rules:
 *
 *   Base transit time   - Route.estimatedTimeMinutes if a route exists, else a
 *                         priority-based fallback (EXPRESS 24h / STANDARD 72h) when there's
 *                         no route yet.
 *   Traffic condition   - HEAVY/CONGESTED/SEVERE +3.0, MODERATE +1.5, else +0, and pushes
 *                         the predicted time back proportionally.
 *   Prior failed deliveries - +2.0 risk per failed attempt (capped at +4.0), pushes the
 *                         predicted time back 12h per attempt.
 *   Already overdue     - if the previous prediction has already passed and the shipment
 *                         isn't delivered/cancelled yet, +2.5 risk, re-anchors the
 *                         prediction to "6 hours from now".
 *   EXPRESS priority     - +1.0 risk (a tighter delivery window has less slack to absorb
 *                         friction).
 *   Long haul (>500km)  - +1.0 risk.
 *
 * delay_risk_score is clamped to [0, 10]. confidence_score starts at 90% and is reduced
 * whenever an input is missing (no route, no traffic condition) or a risk factor fires,
 * clamped to [20, 100].
 *
 * Whenever the newly-calculated delay_risk_score crosses eta.delay-risk-threshold (default
 * 6.0) for the first time - i.e. it was below the threshold before this calculation and is
 * at/above it now - a DELAY_WARNING notification fires via NotificationService.send(...).
 * Comparing against the *previous* stored score (not just "is it currently above
 * threshold") is what stops this from re-firing on every single recalculation while a
 * shipment sits above the line.
 */
@Service
@RequiredArgsConstructor
public class EtaPredictionServiceImpl implements EtaPredictionService {

    private static final Logger log = LoggerFactory.getLogger(EtaPredictionServiceImpl.class);

    private final EtaPredictionRepository etaPredictionRepository;
    private final ShipmentRepository shipmentRepository;
    private final TrackingEventRepository trackingEventRepository;
    private final RouteRepository routeRepository;
    private final NotificationService notificationService;

    @Value("${eta.delay-risk-threshold:6.0}")
    private double delayRiskThreshold;

    private static final List<String> TERMINAL_STATUSES = List.of("DELIVERED", "CANCELLED");

    @Override
    public EtaPredictionResponse calculateForShipment(Long shipmentId) {
        Shipment shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Shipment not found"));

        List<TrackingEvent> events = trackingEventRepository.findByShipmentIdOrderByEventTimestampAsc(shipmentId);
        Route route = routeRepository.findByShipmentIdAndIsCurrentTrue(shipmentId).orElse(null);

        StringBuilder factors = new StringBuilder();
        double risk = 0.0;
        int confidence = 90;

        // --- Base transit time, anchored to when the route was planned (or the shipment
        // was created, if no route exists yet) ---
        int baseMinutes;
        LocalDateTime anchor;
        if (route != null && route.getEstimatedTimeMinutes() != null) {
            baseMinutes = route.getEstimatedTimeMinutes();
            anchor = route.getCreatedAt() != null ? route.getCreatedAt() : shipment.getCreatedAt();
            factors.append("route_estimated_minutes=").append(baseMinutes).append(";");
        } else {
            baseMinutes = "EXPRESS".equalsIgnoreCase(shipment.getPriority()) ? 24 * 60 : 72 * 60;
            anchor = shipment.getCreatedAt();
            confidence -= 15;
            factors.append("no_route_data;fallback_priority_minutes=").append(baseMinutes).append(";");
        }
        LocalDateTime predicted = anchor.plusMinutes(baseMinutes);

        // --- Traffic condition (from the Route) ---
        if (route != null && route.getTrafficCondition() != null && !route.getTrafficCondition().isBlank()) {
            String traffic = route.getTrafficCondition().toUpperCase();
            double trafficRisk = switch (traffic) {
                case "HEAVY", "CONGESTED", "SEVERE" -> 3.0;
                case "MODERATE" -> 1.5;
                default -> 0.0;
            };
            if (trafficRisk > 0) {
                risk += trafficRisk;
                predicted = predicted.plusMinutes(Math.round(trafficRisk * 15));
                factors.append("traffic_condition=").append(traffic).append("(+").append(trafficRisk).append(");");
            }
        } else {
            confidence -= 5;
        }

        // --- Tracking history: prior failed delivery attempts ---
        long failedDeliveries = events.stream()
                .filter(e -> "FAILED_DELIVERY".equalsIgnoreCase(e.getStatus()))
                .count();
        if (failedDeliveries > 0) {
            double failureRisk = Math.min(4.0, failedDeliveries * 2.0);
            risk += failureRisk;
            predicted = predicted.plusHours(failedDeliveries * 12);
            confidence -= Math.min(30, failedDeliveries * 10);
            factors.append("prior_failed_deliveries=").append(failedDeliveries)
                    .append("(+").append(failureRisk).append(");");
        }

        // --- Already running behind the current prediction ---
        boolean isTerminal = TERMINAL_STATUSES.contains(shipment.getStatus());
        if (!isTerminal && LocalDateTime.now().isAfter(predicted)) {
            risk += 2.5;
            confidence -= 10;
            factors.append("already_past_predicted_eta(+2.5);");
            predicted = LocalDateTime.now().plusHours(6);
        }

        // --- Priority tightness ---
        if ("EXPRESS".equalsIgnoreCase(shipment.getPriority())) {
            risk += 1.0;
            factors.append("express_priority_tight_window(+1.0);");
        }

        // --- Long-haul distance (from the Route) ---
        if (route != null && route.getDistanceKm() != null
                && route.getDistanceKm().compareTo(BigDecimal.valueOf(500)) > 0) {
            risk += 1.0;
            factors.append("long_haul_distance_gt_500km(+1.0);");
        }

        BigDecimal delayRiskScore = BigDecimal.valueOf(Math.min(10.0, Math.max(0.0, risk)))
                .setScale(1, RoundingMode.HALF_UP);
        BigDecimal confidenceScore = BigDecimal.valueOf(Math.min(100, Math.max(20, confidence)))
                .setScale(0, RoundingMode.HALF_UP);

        EtaPrediction prediction = etaPredictionRepository.findByShipmentId(shipmentId)
                .orElse(EtaPrediction.builder().shipmentId(shipmentId).build());

        // Captured before being overwritten below - this is what lets us detect a fresh
        // crossing of the threshold rather than firing again on every recalculation.
        BigDecimal previousRiskScore = prediction.getDelayRiskScore();

        prediction.setPredictedDeliveryTime(predicted);
        prediction.setDelayRiskScore(delayRiskScore);
        prediction.setConfidenceScore(confidenceScore);
        prediction.setFactors(factors.toString());
        prediction.setCalculatedAt(LocalDateTime.now());

        EtaPrediction saved = etaPredictionRepository.save(prediction);

        shipment.setEstimatedDeliveryDate(predicted.toLocalDate());
        shipmentRepository.save(shipment);

        boolean wasBelowThreshold = previousRiskScore == null
                || previousRiskScore.doubleValue() < delayRiskThreshold;
        boolean isNowAtOrAboveThreshold = delayRiskScore.doubleValue() >= delayRiskThreshold;
        boolean isTerminalNow = TERMINAL_STATUSES.contains(shipment.getStatus());

        if (wasBelowThreshold && isNowAtOrAboveThreshold && !isTerminalNow) {
            try {
                notificationService.send(NotificationType.DELAY_WARNING, shipment.getCreatedBy(), shipmentId);
            } catch (Exception e) {
                log.warn("Delay-warning notification failed for shipment {}: {}", shipmentId, e.getMessage());
            }
        }

        return mapToResponse(saved);
    }

    @Override
    public EtaPredictionResponse getForShipment(Long shipmentId) {
        EtaPrediction prediction = etaPredictionRepository.findByShipmentId(shipmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "No ETA prediction exists yet for this shipment."));
        return mapToResponse(prediction);
    }

    private EtaPredictionResponse mapToResponse(EtaPrediction p) {
        return EtaPredictionResponse.builder()
                .id(p.getId())
                .shipmentId(p.getShipmentId())
                .predictedDeliveryTime(p.getPredictedDeliveryTime())
                .delayRiskScore(p.getDelayRiskScore())
                .confidenceScore(p.getConfidenceScore())
                .factors(p.getFactors())
                .calculatedAt(p.getCalculatedAt())
                .build();
    }
}
