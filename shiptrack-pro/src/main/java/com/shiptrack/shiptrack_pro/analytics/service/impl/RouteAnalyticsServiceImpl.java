package com.shiptrack.shiptrack_pro.analytics.service.impl;

import com.shiptrack.shiptrack_pro.analytics.dto.RouteAnalyticsResponse;
import com.shiptrack.shiptrack_pro.analytics.dto.RoutePerformanceSummary;
import com.shiptrack.shiptrack_pro.entity.Route;
import com.shiptrack.shiptrack_pro.repository.RouteRepository;
import com.shiptrack.shiptrack_pro.analytics.service.RouteAnalyticsService;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Comparator;
import java.util.List;

@Service
public class RouteAnalyticsServiceImpl
        implements RouteAnalyticsService {

    private final RouteRepository routeRepository;

    public RouteAnalyticsServiceImpl(
            RouteRepository routeRepository) {

        this.routeRepository = routeRepository;
    }

    @Override
    public RouteAnalyticsResponse getRouteAnalytics() {

        List<Route> routes =
                routeRepository.findAll();

        if (routes.isEmpty()) {

            return RouteAnalyticsResponse.builder()
                    .averageRouteDistanceKm(
                            BigDecimal.ZERO
                    )
                    .timeEstimateAccuracyPercentage(
                            BigDecimal.ZERO
                    )
                    .totalRoutes(0)
                    .build();
        }

        BigDecimal totalDistance =
                routes.stream()
                        .map(Route::getDistanceKm)
                        .filter(distance -> distance != null)
                        .reduce(
                                BigDecimal.ZERO,
                                BigDecimal::add
                        );

        long distanceCount =
                routes.stream()
                        .filter(
                                route ->
                                        route.getDistanceKm() != null
                        )
                        .count();

        BigDecimal averageDistance =
                distanceCount == 0
                        ? BigDecimal.ZERO
                        : totalDistance.divide(
                                BigDecimal.valueOf(
                                        distanceCount
                                ),
                                2,
                                RoundingMode.HALF_UP
                        );

        List<RoutePerformanceSummary> completedRoutes =
                routes.stream()
                        .filter(
                                route ->
                                        route.getEstimatedTimeMinutes()
                                                != null
                                                &&
                                                route.getActualTimeMinutes()
                                                        != null
                        )
                        .map(this::toSummary)
                        .toList();

        BigDecimal averageAccuracy =
                completedRoutes.isEmpty()
                        ? BigDecimal.ZERO
                        : completedRoutes.stream()
                        .map(
                                RoutePerformanceSummary::
                                        getAccuracyPercentage
                        )
                        .reduce(
                                BigDecimal.ZERO,
                                BigDecimal::add
                        )
                        .divide(
                                BigDecimal.valueOf(
                                        completedRoutes.size()
                                ),
                                2,
                                RoundingMode.HALF_UP
                        );

        RoutePerformanceSummary bestRoute =
                completedRoutes.stream()
                        .max(
                                Comparator.comparing(
                                        RoutePerformanceSummary::
                                                getAccuracyPercentage
                                )
                        )
                        .orElse(null);

        RoutePerformanceSummary worstRoute =
                completedRoutes.stream()
                        .min(
                                Comparator.comparing(
                                        RoutePerformanceSummary::
                                                getAccuracyPercentage
                                )
                        )
                        .orElse(null);

        return RouteAnalyticsResponse.builder()
                .averageRouteDistanceKm(
                        averageDistance
                )
                .timeEstimateAccuracyPercentage(
                        averageAccuracy
                )
                .bestPerformingRoute(
                        bestRoute
                )
                .worstPerformingRoute(
                        worstRoute
                )
                .totalRoutes(
                        routes.size()
                )
                .build();
    }

    private RoutePerformanceSummary toSummary(
            Route route) {

        BigDecimal accuracy =
                calculateAccuracy(
                        route.getEstimatedTimeMinutes(),
                        route.getActualTimeMinutes()
                );

        return RoutePerformanceSummary.builder()
                .routeId(route.getId())
                .shipmentId(route.getShipmentId())
                .origin(route.getOrigin())
                .destination(route.getDestination())
                .distanceKm(route.getDistanceKm())
                .estimatedTimeMinutes(
                        route.getEstimatedTimeMinutes()
                )
                .actualTimeMinutes(
                        route.getActualTimeMinutes()
                )
                .accuracyPercentage(accuracy)
                .build();
    }

    private BigDecimal calculateAccuracy(
            Integer estimated,
            Integer actual) {

        if (estimated == null
                || actual == null
                || estimated <= 0) {

            return BigDecimal.ZERO;
        }

        BigDecimal difference =
                BigDecimal.valueOf(
                        Math.abs(
                                actual - estimated
                        )
                );

        BigDecimal accuracy =
                BigDecimal.valueOf(100)
                        .subtract(
                                difference
                                        .multiply(
                                                BigDecimal.valueOf(100)
                                        )
                                        .divide(
                                                BigDecimal.valueOf(
                                                        estimated
                                                ),
                                                4,
                                                RoundingMode.HALF_UP
                                        )
                        );

        if (accuracy.compareTo(BigDecimal.ZERO) < 0) {
            accuracy = BigDecimal.ZERO;
        }

        return accuracy.setScale(
                2,
                RoundingMode.HALF_UP
        );
    }
}