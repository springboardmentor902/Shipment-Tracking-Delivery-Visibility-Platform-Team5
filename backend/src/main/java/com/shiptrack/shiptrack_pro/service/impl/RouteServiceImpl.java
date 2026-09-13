package com.shiptrack.shiptrack_pro.service.impl;

import com.shiptrack.shiptrack_pro.dto.DriverLocationRequest;
import com.shiptrack.shiptrack_pro.dto.LocationBroadcastMessage;
import com.shiptrack.shiptrack_pro.dto.RouteRequest;
import com.shiptrack.shiptrack_pro.dto.RouteResponse;
import com.shiptrack.shiptrack_pro.entity.Route;
import com.shiptrack.shiptrack_pro.integration.GoogleMapsService;
import com.shiptrack.shiptrack_pro.integration.RouteAlternativeDTO;
import com.shiptrack.shiptrack_pro.integration.RouteEstimate;
import com.shiptrack.shiptrack_pro.integration.RouteOptimizationResult;
import com.shiptrack.shiptrack_pro.integration.RouteOptimizationService;
import com.shiptrack.shiptrack_pro.repository.RouteRepository;
import com.shiptrack.shiptrack_pro.repository.ShipmentRepository;
import com.shiptrack.shiptrack_pro.service.RouteService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Route Management Module - planning (with Route Optimization), the current active route,
 * full re-route history, and live driver location.
 */
@Service
@RequiredArgsConstructor
public class RouteServiceImpl implements RouteService {

    private static final Logger log = LoggerFactory.getLogger(RouteServiceImpl.class);

    private final RouteRepository routeRepository;
    private final ShipmentRepository shipmentRepository;
    private final GoogleMapsService googleMapsService;
    private final RouteOptimizationService routeOptimizationService;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    @Transactional
    public RouteResponse planRoute(Long shipmentId, RouteRequest request) {
        if (!shipmentRepository.existsById(shipmentId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Shipment not found");
        }

        BigDecimal distanceKm = request.getDistanceKm();
        Integer estimatedTimeMinutes = request.getEstimatedTimeMinutes();
        String trafficCondition = request.getTrafficCondition();
        String selectionReason = null;

        // Only run optimization for whatever the caller didn't already supply - a failure
        // here (missing key, network error, no alternatives, etc.) must never stop the
        // route from being saved; we just fall back to a plain single-estimate lookup, and
        // ultimately to leaving the fields empty.
        if (distanceKm == null || estimatedTimeMinutes == null) {
            try {
                Optional<RouteOptimizationResult> optimized =
                        routeOptimizationService.selectBestRoute(request.getOrigin(), request.getDestination());

                if (optimized.isPresent()) {
                    RouteAlternativeDTO chosen = optimized.get().selected();
                    distanceKm = distanceKm == null ? chosen.distanceKm() : distanceKm;
                    estimatedTimeMinutes = estimatedTimeMinutes == null ? chosen.durationMinutes() : estimatedTimeMinutes;
                    selectionReason = optimized.get().reason();

                    if (trafficCondition == null) {
                        trafficCondition = deriveTrafficCondition(chosen);
                    }
                } else {
                    // No alternatives came back (Maps unconfigured, addresses didn't
                    // geocode, etc.) - fall back to the older single-route estimate.
                    Optional<RouteEstimate> estimate =
                            googleMapsService.estimateRoute(request.getOrigin(), request.getDestination());

                    if (estimate.isPresent()) {
                        distanceKm = distanceKm == null ? estimate.get().distanceKm() : distanceKm;
                        estimatedTimeMinutes = estimatedTimeMinutes == null ? estimate.get().durationMinutes() : estimatedTimeMinutes;
                    } else {
                        log.info("Google Maps could not resolve a route for '{}' -> '{}'. " +
                                "Saving route without distance/time estimates.", request.getOrigin(), request.getDestination());
                    }
                }
            } catch (Exception e) {
                // Extra safety net on top of the integration layer's own internal handling -
                // route creation must succeed regardless of what Maps does.
                log.warn("Route optimization threw an unexpected exception - saving route " +
                        "without distance/time estimates: {}", e.getMessage());
            }
        }

        // Re-route: whatever was current for this shipment stops being current the moment
        // a new route is planned for it.
        routeRepository.findByShipmentIdAndIsCurrentTrue(shipmentId)
                .ifPresent(previous -> {
                    previous.setIsCurrent(false);
                    routeRepository.save(previous);
                });

        Route route = Route.builder()
                .shipmentId(shipmentId)
                .driverId(request.getDriverId())
                .origin(request.getOrigin())
                .destination(request.getDestination())
                .waypoints(request.getWaypoints())
                .distanceKm(distanceKm)
                .estimatedTimeMinutes(estimatedTimeMinutes)
                .trafficCondition(trafficCondition)
                .selectionReason(selectionReason)
                .isCurrent(true)
                .build();

        return mapToResponse(routeRepository.save(route));
    }

    @Override
    public RouteResponse getCurrentRoute(Long shipmentId) {
        Route route = routeRepository.findByShipmentIdAndIsCurrentTrue(shipmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "No route planned yet for this shipment."));
        return mapToResponse(route);
    }

    @Override
    public List<RouteResponse> getRouteHistory(Long shipmentId) {
        return routeRepository.findByShipmentIdOrderByCreatedAtAsc(shipmentId)
                .stream().map(this::mapToResponse).toList();
    }

    @Override
    public RouteResponse completeRoute(Long routeId, Integer actualTimeMinutes) {
        Route route = routeRepository.findById(routeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Route not found"));
        route.setActualTimeMinutes(actualTimeMinutes);
        return mapToResponse(routeRepository.save(route));
    }

    /**
     * Live Delivery Monitoring flow: Driver -> POST /api/route/{id}/location -> save as the
     * route's last known location -> broadcast over STOMP to /topic/shipment/{shipmentId}/location
     * -> any customer subscribed to that shipment's channel receives it instantly.
     */
    @Override
    public RouteResponse updateDriverLocation(Long routeId, DriverLocationRequest request) {
        Route route = routeRepository.findById(routeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Route not found"));

        LocalDateTime now = LocalDateTime.now();
        route.setLastKnownLatitude(request.getLatitude());
        route.setLastKnownLongitude(request.getLongitude());
        route.setLastLocationUpdatedAt(now);

        Route saved = routeRepository.save(route);

        LocationBroadcastMessage message = LocationBroadcastMessage.builder()
                .shipmentId(saved.getShipmentId())
                .routeId(saved.getId())
                .driverId(saved.getDriverId())
                .latitude(saved.getLastKnownLatitude())
                .longitude(saved.getLastKnownLongitude())
                .timestamp(now)
                .build();

        String destination = "/topic/shipment/" + saved.getShipmentId() + "/location";
        try {
            messagingTemplate.convertAndSend(destination, message);
        } catch (Exception e) {
            // The location is already saved - a broadcast failure (e.g. no active broker
            // session) shouldn't turn into a 500 for the driver's app.
            log.warn("Failed to broadcast location update to {}: {}", destination, e.getMessage());
        }

        return mapToResponse(saved);
    }

    /** Rough traffic label from how much the traffic-adjusted duration exceeds the plain estimate - feeds straight into EtaPredictionServiceImpl's existing risk scoring. */
    private String deriveTrafficCondition(RouteAlternativeDTO chosen) {
        if (chosen.trafficAdjustedDurationMinutes() == null || chosen.durationMinutes() == null || chosen.durationMinutes() == 0) {
            return null;
        }
        double ratio = chosen.trafficAdjustedDurationMinutes() / (double) chosen.durationMinutes();
        if (ratio >= 1.3) return "HEAVY";
        if (ratio >= 1.1) return "MODERATE";
        return "LIGHT";
    }

    private RouteResponse mapToResponse(Route r) {
        return RouteResponse.builder()
                .id(r.getId())
                .shipmentId(r.getShipmentId())
                .driverId(r.getDriverId())
                .origin(r.getOrigin())
                .destination(r.getDestination())
                .waypoints(r.getWaypoints())
                .distanceKm(r.getDistanceKm())
                .estimatedTimeMinutes(r.getEstimatedTimeMinutes())
                .actualTimeMinutes(r.getActualTimeMinutes())
                .trafficCondition(r.getTrafficCondition())
                .lastKnownLatitude(r.getLastKnownLatitude())
                .lastKnownLongitude(r.getLastKnownLongitude())
                .lastLocationUpdatedAt(r.getLastLocationUpdatedAt())
                .createdAt(r.getCreatedAt())
                .isCurrent(r.getIsCurrent())
                .selectionReason(r.getSelectionReason())
                .build();
    }
}
