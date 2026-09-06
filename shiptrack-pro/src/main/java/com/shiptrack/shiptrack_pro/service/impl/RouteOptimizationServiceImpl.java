package com.shiptrack.shiptrack_pro.service.impl;

import com.shiptrack.shiptrack_pro.dto.RouteAlternative;
import com.shiptrack.shiptrack_pro.service.GoogleMapsService;
import com.shiptrack.shiptrack_pro.service.RouteOptimizationService;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

@Service
public class RouteOptimizationServiceImpl
        implements RouteOptimizationService {

    private final GoogleMapsService googleMapsService;

    public RouteOptimizationServiceImpl(
            GoogleMapsService googleMapsService) {

        this.googleMapsService = googleMapsService;
    }

    @Override
    public RouteAlternative selectBestRoute(
            String origin,
            String destination) {

        List<RouteAlternative> alternatives =
                getRouteAlternatives(origin, destination);

        if (alternatives == null || alternatives.isEmpty()) {
            throw new RuntimeException(
                    "No route alternatives available"
            );
        }

        RouteAlternative bestRoute =
                alternatives.stream()
                        .min(
                                Comparator.comparing(
                                        RouteAlternative::
                                                getTrafficAdjustedDurationMinutes
                                )
                        )
                        .orElseThrow();

        int selectedTime =
                bestRoute.getTrafficAdjustedDurationMinutes();

        bestRoute.setSelectionReason(
                "Selected because it has the lowest "
                        + "traffic-adjusted travel time of "
                        + selectedTime
                        + " minutes among the available routes."
        );

        return bestRoute;
    }

    @Override
    public List<RouteAlternative> getRouteAlternatives(
            String origin,
            String destination) {

        return googleMapsService.getRouteAlternatives(
                origin,
                destination
        );
    }
}