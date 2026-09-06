package com.shiptrack.shiptrack_pro.analytics.service.impl;

import com.shiptrack.shiptrack_pro.analytics.dto.*;
import com.shiptrack.shiptrack_pro.analytics.service.AnalyticsService;
import com.shiptrack.shiptrack_pro.entity.Notification;
import com.shiptrack.shiptrack_pro.entity.Route;
import com.shiptrack.shiptrack_pro.entity.Shipment;
import com.shiptrack.shiptrack_pro.entity.TrackingEvent;
import com.shiptrack.shiptrack_pro.entity.User;
import com.shiptrack.shiptrack_pro.repository.NotificationRepository;
import com.shiptrack.shiptrack_pro.repository.RouteRepository;
import com.shiptrack.shiptrack_pro.repository.ShipmentRepository;
import com.shiptrack.shiptrack_pro.repository.TrackingEventRepository;
import com.shiptrack.shiptrack_pro.repository.UserRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsServiceImpl
        implements AnalyticsService {

    private final ShipmentRepository shipmentRepository;

    private final UserRepository userRepository;

    private final RouteRepository routeRepository;

    private final TrackingEventRepository trackingEventRepository;

    private final NotificationRepository notificationRepository;


    // ============================================================
    // CUSTOMER ANALYTICS
    // ============================================================

    @Override
    @Cacheable(value = "customerAnalytics", key = "#email")
    public CustomerAnalyticsResponse getCustomerAnalytics(
            String email) {

        User user = getUser(email);

        checkRole(user, "CUSTOMER");

        List<Shipment> shipments =
                shipmentRepository.findByCreatedBy(
                        user.getId()
                );

        long totalShipments =
                shipments.size();

        long activeShipments =
                shipments.stream()
                        .filter(this::isActive)
                        .count();

        long deliveredShipments =
                shipments.stream()
                        .filter(this::isDelivered)
                        .count();

        long pendingShipments =
                activeShipments;

        Map<String, Long> statusBreakdown =
                buildStatusBreakdown(shipments);

        List<ShipmentSummary> history =
                shipments.stream()
                        .sorted(
                                Comparator.comparing(
                                        Shipment::getCreatedAt,
                                        Comparator.nullsLast(
                                                Comparator.reverseOrder()
                                        )
                                )
                        )
                        .map(this::toShipmentSummary)
                        .collect(Collectors.toList());

        List<TrackingInsight> trackingInsights =
                shipments.stream()
                        .map(this::buildTrackingInsight)
                        .collect(Collectors.toList());

        return CustomerAnalyticsResponse.builder()
                .totalShipments(totalShipments)
                .activeShipments(activeShipments)
                .deliveredShipments(deliveredShipments)
                .pendingShipments(pendingShipments)
                .averageDeliveryTimeDays(
                        calculateAverageDeliveryTime(
                                shipments
                        )
                )
                .statusBreakdown(statusBreakdown)
                .shipmentHistory(history)
                .trackingInsights(trackingInsights)
                .build();
    }


    // ============================================================
    // BUSINESS ANALYTICS
    // ============================================================

    @Override
    @Cacheable(value = "businessAnalytics", key = "#email")
    public BusinessAnalyticsResponse getBusinessAnalytics(
            String email) {

        User user = getUser(email);

        checkRole(user, "BUSINESS_CLIENT");

        /*
         * IMPORTANT:
         *
         * We are NOT modifying ShipmentRepository.
         *
         * Current repository doesn't have findByBusinessId(),
         * so we use existing findAll() and filter businessId.
         */

        List<Shipment> shipments =
                shipmentRepository.findAll()
                        .stream()
                        .filter(s ->
                                Objects.equals(
                                        s.getBusinessId(),
                                        user.getId()
                                )
                        )
                        .collect(Collectors.toList());

        long totalShipments =
                shipments.size();

        long activeShipments =
                shipments.stream()
                        .filter(this::isActive)
                        .count();

        long deliveredShipments =
                shipments.stream()
                        .filter(this::isDelivered)
                        .count();

        long delayedShipments =
                shipments.stream()
                        .filter(this::isDelayed)
                        .count();

        double deliverySuccessRate =
                totalShipments == 0
                        ? 0.0
                        : deliveredShipments
                            * 100.0
                            / totalShipments;

        long customerCount =
                shipments.stream()
                        .map(Shipment::getCreatedBy)
                        .filter(Objects::nonNull)
                        .distinct()
                        .count();

        Map<String, Long> statusBreakdown =
                buildStatusBreakdown(shipments);

        List<ShipmentSummary> summaries =
                shipments.stream()
                        .sorted(
                                Comparator.comparing(
                                        Shipment::getCreatedAt,
                                        Comparator.nullsLast(
                                                Comparator.reverseOrder()
                                        )
                                )
                        )
                        .map(this::toShipmentSummary)
                        .collect(Collectors.toList());

        List<RoutePerformance> routes =
                buildRoutePerformance(shipments);

        return BusinessAnalyticsResponse.builder()
                .totalShipments(totalShipments)
                .activeShipments(activeShipments)
                .deliveredShipments(deliveredShipments)
                .delayedShipments(delayedShipments)
                .customerCount(customerCount)
                .deliverySuccessRate(
                        round(deliverySuccessRate)
                )
                .averageDeliveryTimeDays(
                        calculateAverageDeliveryTime(
                                shipments
                        )
                )
                .statusBreakdown(statusBreakdown)
                .shipmentAnalytics(summaries)
                .routePerformance(routes)
                .build();
    }


    // ============================================================
    // ADMIN ANALYTICS
    // ============================================================

    @Override
    @Cacheable(value = "adminAnalytics", key = "#email")
    public AdminAnalyticsResponse getAdminAnalytics(
            String email) {

        User admin = getUser(email);

        checkRole(admin, "ADMINISTRATOR");

        List<Shipment> shipments =
                shipmentRepository.findAll();

        List<User> users =
                userRepository.findAll();

        long totalUsers =
                users.size();

        long totalCustomers =
                countUsersByRole(
                        users,
                        "CUSTOMER"
                );

        long totalBusinessClients =
                countUsersByRole(
                        users,
                        "BUSINESS_CLIENT"
                );

        long totalLogisticsOperators =
                countUsersByRole(
                        users,
                        "LOGISTICS_OPERATOR"
                );

        long totalSupportAgents =
                countUsersByRole(
                        users,
                        "SUPPORT_AGENT"
                );

        long totalShipments =
                shipments.size();

        long activeShipments =
                shipments.stream()
                        .filter(this::isActive)
                        .count();

        long deliveredShipments =
                shipments.stream()
                        .filter(this::isDelivered)
                        .count();

        long delayedShipments =
                shipments.stream()
                        .filter(this::isDelayed)
                        .count();

        double deliverySuccessRate =
                totalShipments == 0
                        ? 0.0
                        : deliveredShipments
                            * 100.0
                            / totalShipments;

        Map<String, Long> statusBreakdown =
                buildStatusBreakdown(shipments);

        List<RoutePerformance> routes =
                buildRoutePerformance(shipments);

        /*
         * ========================================================
         * ROUTE MANAGEMENT ANALYTICS
         * ========================================================
         */

        double averageRouteDistanceKm =
                calculateAverageRouteDistance(shipments);

        double timeEstimateAccuracy =
                calculateTimeEstimateAccuracy(shipments);

        RoutePerformance bestRoute =
                findBestRoute(routes);

        RoutePerformance worstRoute =
                findWorstRoute(routes);

        SystemMonitoring monitoring =
                buildSystemMonitoring();

        ReportsSummary reports =
                ReportsSummary.builder()
                        .status("READY")
                        .message(
                                "Reports management is available"
                        )
                        .build();

        return AdminAnalyticsResponse.builder()
                .totalUsers(totalUsers)
                .totalCustomers(totalCustomers)
                .totalBusinessClients(
                        totalBusinessClients
                )
                .totalLogisticsOperators(
                        totalLogisticsOperators
                )
                .totalSupportAgents(
                        totalSupportAgents
                )
                .totalShipments(totalShipments)
                .activeShipments(activeShipments)
                .deliveredShipments(
                        deliveredShipments
                )
                .delayedShipments(
                        delayedShipments
                )
                .deliverySuccessRate(
                        round(deliverySuccessRate)
                )
                .averageDeliveryTimeDays(
                        calculateAverageDeliveryTime(
                                shipments
                        )
                )
                .shipmentStatusBreakdown(
                        statusBreakdown
                )
                .routePerformance(routes)
                .averageRouteDistanceKm(
                        averageRouteDistanceKm
                )
                .timeEstimateAccuracy(
                        timeEstimateAccuracy
                )
                .bestRoute(bestRoute)
                .worstRoute(worstRoute)
                .systemMonitoring(monitoring)
                .reports(reports)
                .build();
    }


    // ============================================================
    // USER
    // ============================================================

    private User getUser(String email) {

        return userRepository
                .findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException(
                                "User not found"
                        )
                );
    }


    private void checkRole(
            User user,
            String expectedRole) {

        if (user.getRole() == null
                || !user.getRole()
                .equalsIgnoreCase(expectedRole)) {

            throw new AccessDeniedException(
                    "You are not authorized to access this analytics dashboard"
            );
        }
    }


    // ============================================================
    // STATUS
    // ============================================================

    private boolean isDelivered(
            Shipment shipment) {

        return shipment.getStatus() != null
                && shipment.getStatus()
                    .name()
                    .equalsIgnoreCase("DELIVERED");
    }


    private boolean isActive(
            Shipment shipment) {

        if (shipment.getStatus() == null) {
            return false;
        }

        String status =
                shipment.getStatus()
                        .name()
                        .toUpperCase();

        return !status.equals("DELIVERED")
                && !status.equals("CANCELLED")
                && !status.equals("FAILED_DELIVERY");
    }


    private boolean isDelayed(
            Shipment shipment) {

        if (shipment.getEstimatedDeliveryDate()
                == null) {

            return false;
        }

        LocalDate estimated =
                shipment.getEstimatedDeliveryDate();

        LocalDate actual =
                shipment.getActualDeliveryDate();

        if (actual != null) {

            return actual.isAfter(estimated);
        }

        return isActive(shipment)
                && LocalDate.now()
                    .isAfter(estimated);
    }


    // ============================================================
    // STATUS BREAKDOWN
    // ============================================================

    private Map<String, Long>
    buildStatusBreakdown(
            List<Shipment> shipments) {

        return shipments.stream()
                .filter(s ->
                        s.getStatus() != null
                )
                .collect(
                        Collectors.groupingBy(
                                s ->
                                        s.getStatus()
                                                .name(),
                                Collectors.counting()
                        )
                );
    }


    // ============================================================
    // SHIPMENT SUMMARY
    // ============================================================

    private ShipmentSummary
    toShipmentSummary(
            Shipment shipment) {

        return ShipmentSummary.builder()
                .shipmentId(shipment.getId())
                .trackingNumber(
                        shipment.getTrackingNumber()
                )
                .status(
                        shipment.getStatus() == null
                                ? null
                                : shipment.getStatus()
                                    .name()
                )
                .priority(
                        shipment.getPriority()
                )
                .pickupAddress(
                        shipment.getPickupAddress()
                )
                .deliveryAddress(
                        shipment.getDeliveryAddress()
                )
                .estimatedDeliveryDate(
                        shipment.getEstimatedDeliveryDate()
                )
                .actualDeliveryDate(
                        shipment.getActualDeliveryDate()
                )
                .build();
    }


    // ============================================================
    // AVERAGE DELIVERY TIME
    // ============================================================

    private double
    calculateAverageDeliveryTime(
            List<Shipment> shipments) {

        List<Long> deliveryTimes =
                shipments.stream()
                        .filter(s ->
                                s.getCreatedAt() != null
                                        && s.getActualDeliveryDate() != null
                        )
                        .map(s -> {

                            LocalDate deliveryDate =
                                    s.getActualDeliveryDate();

                            return Duration.between(
                                    s.getCreatedAt(),
                                    deliveryDate.atStartOfDay()
                            ).toDays();
                        })
                        .filter(days -> days >= 0)
                        .collect(Collectors.toList());

        if (deliveryTimes.isEmpty()) {
            return 0.0;
        }

        double average =
                deliveryTimes.stream()
                        .mapToLong(Long::longValue)
                        .average()
                        .orElse(0.0);

        return round(average);
    }


    // ============================================================
    // TRACKING INSIGHTS
    // ============================================================

    private TrackingInsight
    buildTrackingInsight(
            Shipment shipment) {

        List<TrackingEvent> events =
                trackingEventRepository
                        .findByShipmentIdOrderByEventTimestampAsc(
                                shipment.getId()
                        );

        TrackingEvent latest =
                events.isEmpty()
                        ? null
                        : events.get(
                                events.size() - 1
                        );

        return TrackingInsight.builder()
                .shipmentId(shipment.getId())
                .trackingNumber(
                        shipment.getTrackingNumber()
                )
                .currentStatus(
                        latest != null
                                && latest.getStatus() != null
                                ? latest.getStatus()
                                : shipment.getStatus() == null
                                    ? null
                                    : shipment.getStatus()
                                        .name()
                )
                .latestLocation(
                        latest == null
                                ? null
                                : latest.getLocation()
                )
                .latestEventTime(
                        latest == null
                                ? null
                                : latest.getEventTimestamp()
                )
                .trackingEventCount(
                        events.size()
                )
                .build();
    }


    // ============================================================
    // ROUTE PERFORMANCE
    // ============================================================

    private List<RoutePerformance>
    buildRoutePerformance(
            List<Shipment> shipments) {

        List<RoutePerformance> result =
                new ArrayList<>();

        for (Shipment shipment : shipments) {

            List<Route> routes =
                    routeRepository
                            .findAllByShipmentIdOrderByCreatedAtDesc(
                                    shipment.getId()
                            );

            if (routes.isEmpty()) {
                continue;
            }

            /*
             * First route is the latest/current route
             * because repository sorts by createdAt DESC.
             */
            Route route = routes.get(0);

            String performanceStatus =
                    calculateRouteStatus(route);

            result.add(
                    RoutePerformance.builder()
                            .routeId(route.getId())
                            .shipmentId(
                                    route.getShipmentId()
                            )
                            .origin(
                                    route.getOrigin()
                            )
                            .destination(
                                    route.getDestination()
                            )
                            .distanceKm(
                                    route.getDistanceKm()
                                            == null
                                            ? null
                                            : route.getDistanceKm()
                                                .doubleValue()
                            )
                            .estimatedTimeMinutes(
                                    route.getEstimatedTimeMinutes()
                            )
                            .actualTimeMinutes(
                                    route.getActualTimeMinutes()
                            )
                            .trafficCondition(
                                    route.getTrafficCondition()
                            )
                            .performanceStatus(
                                    performanceStatus
                            )
                            .build()
            );
        }

        return result;
    }


    private String calculateRouteStatus(
            Route route) {

        if (route.getEstimatedTimeMinutes()
                == null
                || route.getActualTimeMinutes()
                    == null) {

            return "DATA_PENDING";
        }

        if (route.getActualTimeMinutes()
                <= route.getEstimatedTimeMinutes()) {

            return "ON_TIME";
        }

        return "DELAYED";
    }


    // ============================================================
    // ROUTE MANAGEMENT ANALYTICS
    // ============================================================

    /**
     * Calculates the average distance of the latest
     * route for every shipment that has a route.
     */
    private double calculateAverageRouteDistance(
            List<Shipment> shipments) {

        List<Double> distances =
                new ArrayList<>();

        for (Shipment shipment : shipments) {

            List<Route> routes =
                    routeRepository
                            .findAllByShipmentIdOrderByCreatedAtDesc(
                                    shipment.getId()
                            );

            if (routes.isEmpty()) {
                continue;
            }

            Route route = routes.get(0);

            if (route.getDistanceKm() != null) {

                distances.add(
                        route.getDistanceKm()
                                .doubleValue()
                );
            }
        }

        if (distances.isEmpty()) {
            return 0.0;
        }

        double average =
                distances.stream()
                        .mapToDouble(Double::doubleValue)
                        .average()
                        .orElse(0.0);

        return round(average);
    }


    /**
     * Calculates time-estimate accuracy based on routes
     * where both estimated and actual travel time exist.
     *
     * Accuracy formula:
     *
     * 100 - average percentage error
     *
     * The result is limited between 0 and 100.
     */
    private double calculateTimeEstimateAccuracy(
            List<Shipment> shipments) {

        List<Double> percentageErrors =
                new ArrayList<>();

        for (Shipment shipment : shipments) {

            List<Route> routes =
                    routeRepository
                            .findAllByShipmentIdOrderByCreatedAtDesc(
                                    shipment.getId()
                            );

            if (routes.isEmpty()) {
                continue;
            }

            Route route = routes.get(0);

            Integer estimated =
                    route.getEstimatedTimeMinutes();

            Integer actual =
                    route.getActualTimeMinutes();

            if (estimated == null
                    || actual == null
                    || estimated <= 0) {

                continue;
            }

            double error =
                    Math.abs(
                            actual - estimated
                    ) * 100.0 / estimated;

            percentageErrors.add(error);
        }

        if (percentageErrors.isEmpty()) {
            return 0.0;
        }

        double averageError =
                percentageErrors.stream()
                        .mapToDouble(
                                Double::doubleValue
                        )
                        .average()
                        .orElse(0.0);

        double accuracy =
                100.0 - averageError;

        if (accuracy < 0.0) {
            accuracy = 0.0;
        }

        if (accuracy > 100.0) {
            accuracy = 100.0;
        }

        return round(accuracy);
    }


    /**
     * Finds the best route from routes that have usable
     * time information.
     *
     * Actual travel time is preferred. Estimated time is
     * used only when actual time is unavailable.
     *
     * Routes with both actual and estimated time missing
     * are excluded.
     */
    private RoutePerformance findBestRoute(
            List<RoutePerformance> routes) {

        if (routes == null || routes.isEmpty()) {
            return null;
        }

        return routes.stream()
                .filter(Objects::nonNull)
                .filter(route ->
                        route.getActualTimeMinutes() != null
                                || route.getEstimatedTimeMinutes() != null
                )
                .min(
                        Comparator.comparingDouble(
                                this::routeComparisonTime
                        )
                )
                .orElse(null);
    }


    /**
     * Finds the worst route from routes that have usable
     * time information.
     *
     * Actual travel time is preferred. Estimated time is
     * used only when actual time is unavailable.
     *
     * Routes with both actual and estimated time missing
     * are excluded.
     */
    private RoutePerformance findWorstRoute(
            List<RoutePerformance> routes) {

        if (routes == null || routes.isEmpty()) {
            return null;
        }

        return routes.stream()
                .filter(Objects::nonNull)
                .filter(route ->
                        route.getActualTimeMinutes() != null
                                || route.getEstimatedTimeMinutes() != null
                )
                .max(
                        Comparator.comparingDouble(
                                this::routeComparisonTime
                        )
                )
                .orElse(null);
    }


    /**
     * Returns the time used to compare routes.
     *
     * Actual time is preferred because it represents
     * real route performance.
     *
     * Estimated time is used as fallback when actual
     * travel time is not available.
     */
    private double routeComparisonTime(
            RoutePerformance route) {

        if (route.getActualTimeMinutes() != null) {

            return route.getActualTimeMinutes()
                    .doubleValue();
        }

        if (route.getEstimatedTimeMinutes() != null) {

            return route.getEstimatedTimeMinutes()
                    .doubleValue();
        }

        return Double.MAX_VALUE;
    }


    // ============================================================
    // SYSTEM MONITORING
    // ============================================================

    private SystemMonitoring
    buildSystemMonitoring() {

        List<Notification> notifications =
                notificationRepository.findAll();

        long sent =
                notifications.stream()
                        .filter(n ->
                                n.getStatus() != null
                                        && n.getStatus()
                                            .equalsIgnoreCase("SENT")
                        )
                        .count();

        long failed =
                notifications.stream()
                        .filter(n ->
                                n.getStatus() != null
                                        && n.getStatus()
                                            .equalsIgnoreCase("FAILED")
                        )
                        .count();

        long totalAttempts =
                sent + failed;

        double successRate =
                totalAttempts == 0
                        ? 0.0
                        : sent * 100.0
                            / totalAttempts;

        return SystemMonitoring.builder()
                .backendStatus("UP")
                .mapsStatus("AVAILABLE")
                .notificationStatus(
                        failed == 0
                                ? "HEALTHY"
                                : "DEGRADED"
                )
                .websocketStatus("ACTIVE")
                .notificationsSent(sent)
                .notificationsFailed(failed)
                .notificationSuccessRate(
                        round(successRate)
                )
                .build();
    }


    // ============================================================
    // USER ROLE COUNT
    // ============================================================

    private long countUsersByRole(
            List<User> users,
            String role) {

        return users.stream()
                .filter(u ->
                        u.getRole() != null
                                && u.getRole()
                                    .equalsIgnoreCase(role)
                )
                .count();
    }


    // ============================================================
    // ROUNDING
    // ============================================================

    private double round(double value) {

        return Math.round(
                value * 100.0
        ) / 100.0;
    }
}
