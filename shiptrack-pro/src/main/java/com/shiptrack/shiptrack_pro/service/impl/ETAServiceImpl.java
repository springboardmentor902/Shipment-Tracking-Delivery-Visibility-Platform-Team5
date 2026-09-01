package com.shiptrack.shiptrack_pro.service.impl;

import com.shiptrack.shiptrack_pro.entity.ETAPrediction;
import com.shiptrack.shiptrack_pro.entity.Route;
import com.shiptrack.shiptrack_pro.entity.Shipment;
import com.shiptrack.shiptrack_pro.entity.TrackingEvent;
import com.shiptrack.shiptrack_pro.repository.ETAPredictionRepository;
import com.shiptrack.shiptrack_pro.repository.RouteRepository;
import com.shiptrack.shiptrack_pro.repository.ShipmentRepository;
import com.shiptrack.shiptrack_pro.repository.TrackingEventRepository;
import com.shiptrack.shiptrack_pro.service.ETAService;
import com.shiptrack.shiptrack_pro.service.NotificationService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ETAServiceImpl implements ETAService {

    private static final int DELAY_WARNING_THRESHOLD = 7;

    private final ETAPredictionRepository etaPredictionRepository;
    private final ShipmentRepository shipmentRepository;
    private final RouteRepository routeRepository;
    private final TrackingEventRepository trackingEventRepository;
    private final NotificationService notificationService;

    @Override
    public ETAPrediction calculateAndSave(Long shipmentId) {

        Shipment shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Shipment not found with id: " + shipmentId
                ));

        List<Route> routes =
                routeRepository.findAllByShipmentIdOrderByCreatedAtDesc(
                        shipmentId
                );

        if (routes.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Route not found for shipment: " + shipmentId
            );
        }

        Route route = routes.get(0);

        if (route.getEstimatedTimeMinutes() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Estimated route time is not available"
            );
        }

        List<TrackingEvent> trackingEvents =
                trackingEventRepository
                        .findByShipmentIdOrderByEventTimestampAsc(
                                shipmentId
                        );

        int baseMinutes = route.getEstimatedTimeMinutes();

        String traffic = route.getTrafficCondition();

        if (traffic == null) {
            traffic = "NORMAL";
        }

        traffic = traffic.trim().toUpperCase();

        int extraMinutes;
        int riskScore;

        StringBuilder factors = new StringBuilder();

        factors.append("Base estimated time: ")
                .append(baseMinutes)
                .append(" minutes. ");

        switch (traffic) {

            case "HEAVY":
                extraMinutes = (int) Math.ceil(baseMinutes * 0.30);
                riskScore = 8;
                factors.append("Heavy traffic increased ETA by 30%. ");
                break;

            case "MODERATE":
                extraMinutes = (int) Math.ceil(baseMinutes * 0.15);
                riskScore = 4;
                factors.append("Moderate traffic increased ETA by 15%. ");
                break;

            case "LOW":
                extraMinutes = (int) Math.ceil(baseMinutes * 0.05);
                riskScore = 1;
                factors.append("Low traffic caused a small ETA adjustment. ");
                break;

            default:
                extraMinutes = 0;
                riskScore = 2;
                factors.append("Normal traffic condition. ");
        }

        if (!trackingEvents.isEmpty()) {

            factors.append("Tracking history contains ")
                    .append(trackingEvents.size())
                    .append(" event(s). ");

            if (trackingEvents.size() >= 3) {
                riskScore = Math.max(0, riskScore - 1);
                factors.append("Sufficient tracking history available. ");
            }

        } else {

            factors.append("No tracking history available yet. ");
            riskScore = Math.min(10, riskScore + 1);
        }

        if (!trackingEvents.isEmpty()) {

            TrackingEvent latestEvent =
                    trackingEvents.get(trackingEvents.size() - 1);

            String latestStatus = latestEvent.getStatus();

            if (latestStatus != null) {

                String status = latestStatus.toUpperCase();

                if (status.contains("DELAY")
                        || status.contains("FAILED")) {

                    riskScore = Math.min(10, riskScore + 2);

                    factors.append(
                            "Latest tracking status indicates possible delay. "
                    );
                }
            }
        }

        riskScore = Math.max(0, Math.min(10, riskScore));

        BigDecimal confidenceScore;

        if (trackingEvents.size() >= 3) {
            confidenceScore = BigDecimal.valueOf(90);
        } else if (!trackingEvents.isEmpty()) {
            confidenceScore = BigDecimal.valueOf(80);
        } else {
            confidenceScore = BigDecimal.valueOf(70);
        }

        LocalDateTime now = LocalDateTime.now();

        LocalDateTime predictedDeliveryTime =
                now.plusMinutes(baseMinutes + extraMinutes);

        ETAPrediction prediction =
                etaPredictionRepository
                        .findByShipmentId(shipmentId)
                        .orElse(
                                ETAPrediction.builder()
                                        .shipmentId(shipmentId)
                                        .build()
                        );

        prediction.setShipmentId(shipment.getId());
        prediction.setPredictedDeliveryTime(predictedDeliveryTime);
        prediction.setDelayRiskScore(riskScore);
        prediction.setConfidenceScore(confidenceScore);
        prediction.setFactors(factors.toString());
        prediction.setCalculatedAt(now);

        ETAPrediction savedPrediction =
                etaPredictionRepository.save(prediction);

        /*
         * DELAY_WARNING notification
         *
         * Risk score is from 0 to 10.
         * A score of 7 or higher is treated as a delay warning.
         *
         * The NotificationService already contains duplicate
         * prevention, so repeated ETA recalculations will not
         * continuously send the same notification.
         */
        if (riskScore >= DELAY_WARNING_THRESHOLD) {

            try {

                notificationService.createNotification(
                        shipment.getCreatedBy(),
                        shipment.getId(),
                        "Delivery Delay Warning",
                        "Shipment "
                                + shipment.getTrackingNumber()
                                + " has a high delay risk. "
                                + "Current delay risk score: "
                                + riskScore
                                + "/10.",
                        "DELAY_WARNING"
                );

            } catch (Exception e) {

                /*
                 * Notification failure should not make
                 * ETA calculation fail.
                 */
                System.out.println(
                        "Delay warning notification failed for shipment "
                                + shipmentId
                                + ": "
                                + e.getMessage()
                );
            }
        }

        return savedPrediction;
    }

    @Override
    public ETAPrediction getPrediction(Long shipmentId) {

        return etaPredictionRepository
                .findByShipmentId(shipmentId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "ETA prediction not found for shipment: "
                                        + shipmentId
                        )
                );
    }

    /*
     * Existing ETA recalculation.
     *
     * Keeping your current 30-minute schedule unchanged.
     */
    @Scheduled(fixedRate = 30 * 60 * 1000)
    public void recalculateETAs() {

        List<Shipment> shipments = shipmentRepository.findAll();

        for (Shipment shipment : shipments) {

            if (shipment.getStatus() == null) {
                continue;
            }

            String status =
                    shipment.getStatus()
                            .name()
                            .toUpperCase();

            if (status.equals("PICKED_UP")
                    || status.equals("IN_TRANSIT")
                    || status.equals("OUT_FOR_DELIVERY")) {

                try {

                    calculateAndSave(shipment.getId());

                } catch (Exception e) {

                    System.out.println(
                            "ETA recalculation failed for shipment "
                                    + shipment.getId()
                                    + ": "
                                    + e.getMessage()
                    );
                }
            }
        }
    }
}