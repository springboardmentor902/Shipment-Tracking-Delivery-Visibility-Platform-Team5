package com.shiptrack.shiptrack_pro.service.impl;

import com.shiptrack.shiptrack_pro.dto.*;
import com.shiptrack.shiptrack_pro.entity.*;
import com.shiptrack.shiptrack_pro.repository.*;
import com.shiptrack.shiptrack_pro.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Analytics Dashboard Module - one method per role (Customer / Business Client / Admin),
 * each scoped to exactly what that role should see. All four public "get" methods are
 * cached in Redis (see config/CacheConfig) with a 5-minute TTL by default
 * (analytics.cache-ttl-minutes) - repeated dashboard loads within that window hit the cache
 * instead of re-running the aggregation. If Redis is unreachable, CacheConfig's error
 * handler logs and swallows the failure rather than breaking the request - these endpoints
 * work with or without Redis running, just without the caching benefit.
 *
 * buildAnalytics(List<Shipment>) is the one shared aggregation at the heart of all four
 * "get" methods (overall, per-business, customer's own, business's own) - status
 * breakdown, on-time delivery rate, active/cancelled counts are computed exactly once and
 * reused everywhere, per the "don't duplicate the aggregation logic" principle carried
 * through into the Reports module too (ReportBuildingServiceImpl reuses this same service).
 */
@Service
@RequiredArgsConstructor
public class AnalyticsServiceImpl implements AnalyticsService {

    private final ShipmentRepository shipmentRepository;
    private final UserRepository userRepository;
    private final RouteRepository routeRepository;
    private final EtaPredictionRepository etaPredictionRepository;
    private final ProofOfDeliveryRepository podRepository;
    private final BusinessAccountRepository businessAccountRepository;

    @Value("${eta.delay-risk-threshold:6.0}")
    private double delayRiskThreshold;

    private static final List<String> REPORT_TYPES = List.of(
            "SHIPMENTS", "DELIVERY", "ROUTE_PERFORMANCE", "DELAY_ANALYSIS");

    @Override
    @Cacheable("overallAnalytics")
    public DashboardAnalyticsResponse getOverallAnalytics() {
        return buildAnalytics(shipmentRepository.findAll());
    }

    @Override
    @Cacheable(value = "businessAnalytics", key = "#businessId")
    public DashboardAnalyticsResponse getAnalyticsForBusiness(Long businessId) {
        return buildAnalytics(shipmentRepository.findByBusinessId(businessId));
    }

    @Override
    @Cacheable(value = "customerAnalytics", key = "#userId")
    public CustomerAnalyticsResponse getCustomerAnalytics(Long userId) {
        List<Shipment> shipments = shipmentRepository.findByCreatedBy(userId);

        Map<String, Long> byStatus = shipments.stream()
                .collect(Collectors.groupingBy(Shipment::getStatus, Collectors.counting()));
        long delivered = byStatus.getOrDefault("DELIVERED", 0L);
        long cancelled = byStatus.getOrDefault("CANCELLED", 0L);
        long failed = byStatus.getOrDefault("FAILED_DELIVERY", 0L);
        long active = Math.max(0, shipments.size() - delivered - cancelled - failed);

        List<ShipmentSummary> history = shipments.stream()
                .sorted(Comparator.comparing(Shipment::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(20)
                .map(this::toSummary)
                .toList();

        // Tracking insight: average time from creation to actual delivery, in hours -
        // approximate (createdAt is a precise timestamp, actualDeliveryDate is a date only).
        List<Shipment> deliveredWithDates = shipments.stream()
                .filter(s -> "DELIVERED".equals(s.getStatus()) && s.getActualDeliveryDate() != null && s.getCreatedAt() != null)
                .toList();
        Double avgTransitHours = deliveredWithDates.isEmpty() ? null : deliveredWithDates.stream()
                .mapToLong(s -> ChronoUnit.HOURS.between(s.getCreatedAt(), s.getActualDeliveryDate().atStartOfDay()))
                .average()
                .orElse(0);

        Map<String, Long> byPriority = shipments.stream()
                .filter(s -> s.getPriority() != null)
                .collect(Collectors.groupingBy(Shipment::getPriority, Collectors.counting()));

        return CustomerAnalyticsResponse.builder()
                .activeShipmentCount(active)
                .totalShipments(shipments.size())
                .shipmentsByStatus(byStatus)
                .shipmentHistory(history)
                .avgTransitHours(avgTransitHours)
                .shipmentsByPriority(byPriority)
                .build();
    }

    @Override
    @Cacheable(value = "businessAnalyticsForUser", key = "#userId")
    public BusinessAnalyticsResponse getBusinessAnalyticsForUser(Long userId) {
        BusinessAccount account = businessAccountRepository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "No business account found for this user."));

        List<Shipment> shipments = shipmentRepository.findByBusinessId(account.getId());
        DashboardAnalyticsResponse overview = buildAnalytics(shipments);

        Set<Long> shipmentIds = shipments.stream().map(Shipment::getId).collect(Collectors.toSet());
        List<EtaPrediction> predictions = etaPredictionRepository.findAll().stream()
                .filter(p -> shipmentIds.contains(p.getShipmentId()))
                .toList();

        long atRisk = predictions.stream()
                .filter(p -> p.getDelayRiskScore() != null && p.getDelayRiskScore().doubleValue() >= delayRiskThreshold)
                .count();
        Double avgRisk = predictions.isEmpty() ? null : predictions.stream()
                .filter(p -> p.getDelayRiskScore() != null)
                .mapToDouble(p -> p.getDelayRiskScore().doubleValue())
                .average()
                .orElse(0);

        Map<Long, Shipment> shipmentByIdForRisk = shipments.stream()
                .collect(Collectors.toMap(Shipment::getId, java.util.function.Function.identity(), (a, b) -> a));

        List<AtRiskShipmentEntry> atRiskShipments = predictions.stream()
                .filter(p -> p.getDelayRiskScore() != null && p.getDelayRiskScore().doubleValue() >= delayRiskThreshold)
                .sorted(Comparator.comparing(EtaPrediction::getDelayRiskScore, Comparator.reverseOrder()))
                .map(p -> {
                    Shipment s = shipmentByIdForRisk.get(p.getShipmentId());
                    return AtRiskShipmentEntry.builder()
                            .shipmentId(p.getShipmentId())
                            .trackingNumber(s == null ? null : s.getTrackingNumber())
                            .status(s == null ? null : s.getStatus())
                            .delayRiskScore(p.getDelayRiskScore())
                            .predictedDeliveryTime(p.getPredictedDeliveryTime())
                            .build();
                })
                .toList();

        DelayAnalysis delayAnalysis = DelayAnalysis.builder()
                .atRiskShipmentCount(atRisk)
                .avgDelayRiskScore(avgRisk)
                .delayedDeliveryCount(overview.getDeliveredLate())
                .atRiskShipments(atRiskShipments)
                .build();

        Map<String, List<Shipment>> byReceiver = shipments.stream()
                .filter(s -> s.getReceiverEmail() != null && !s.getReceiverEmail().isBlank())
                .collect(Collectors.groupingBy(Shipment::getReceiverEmail));

        List<CustomerActivityEntry> topCustomers = byReceiver.entrySet().stream()
                .map(e -> CustomerActivityEntry.builder()
                        .receiverEmail(e.getKey())
                        .receiverName(e.getValue().get(0).getReceiverName())
                        .shipmentCount(e.getValue().size())
                        .build())
                .sorted(Comparator.comparingLong(CustomerActivityEntry::getShipmentCount).reversed())
                .limit(5)
                .toList();

        CustomerActivitySummary customerActivity = CustomerActivitySummary.builder()
                .distinctCustomerCount(byReceiver.size())
                .topCustomers(topCustomers)
                .build();

        return BusinessAnalyticsResponse.builder()
                .overview(overview)
                .delayAnalysis(delayAnalysis)
                .customerActivity(customerActivity)
                .build();
    }

    @Override
    @Cacheable("adminAnalytics")
    public AdminAnalyticsResponse getAdminAnalytics() {
        List<Shipment> shipments = shipmentRepository.findAll();
        DashboardAnalyticsResponse overview = buildAnalytics(shipments);

        List<User> users = userRepository.findAll();
        Map<String, Long> usersByRole = users.stream()
                .collect(Collectors.groupingBy(User::getRole, Collectors.counting()));
        long activeUsers = users.stream().filter(u -> "ACTIVE".equals(u.getStatus())).count();

        UserSummary userSummary = UserSummary.builder()
                .totalUsers(users.size())
                .usersByRole(usersByRole)
                .activeUsers(activeUsers)
                .inactiveUsers(users.size() - activeUsers)
                .build();

        List<Route> routes = routeRepository.findAll();
        Double avgDistance = average(routes.stream()
                .map(Route::getDistanceKm).filter(java.util.Objects::nonNull).map(BigDecimal::doubleValue));
        Double avgEstimated = average(routes.stream()
                .map(Route::getEstimatedTimeMinutes).filter(java.util.Objects::nonNull).map(Integer::doubleValue));
        Double avgActual = average(routes.stream()
                .map(Route::getActualTimeMinutes).filter(java.util.Objects::nonNull).map(Integer::doubleValue));
        Double avgVariance = average(routes.stream()
                .filter(r -> r.getEstimatedTimeMinutes() != null && r.getActualTimeMinutes() != null)
                .map(r -> (double) (r.getActualTimeMinutes() - r.getEstimatedTimeMinutes())));

        // Route Analytics: accuracy per completed route (both estimate and actual present),
        // then the average across all of them, plus whichever single routes were the best
        // and worst examples of that accuracy.
        Map<Long, Shipment> shipmentByIdForRoutes = shipments.stream()
                .collect(Collectors.toMap(Shipment::getId, java.util.function.Function.identity(), (a, b) -> a));

        List<RouteAnalyticsEntry> completedRouteEntries = routes.stream()
                .filter(r -> r.getEstimatedTimeMinutes() != null && r.getActualTimeMinutes() != null
                        && r.getEstimatedTimeMinutes() > 0)
                .map(r -> toAnalyticsEntry(r, shipmentByIdForRoutes.get(r.getShipmentId())))
                .toList();

        Double timeEstimateAccuracyPercent = completedRouteEntries.isEmpty() ? null : completedRouteEntries.stream()
                .mapToDouble(RouteAnalyticsEntry::accuracyPercent)
                .average()
                .orElse(0);

        RouteAnalyticsEntry bestRoute = completedRouteEntries.stream()
                .max(Comparator.comparingDouble(RouteAnalyticsEntry::accuracyPercent))
                .orElse(null);
        RouteAnalyticsEntry worstRoute = completedRouteEntries.stream()
                .min(Comparator.comparingDouble(RouteAnalyticsEntry::accuracyPercent))
                .orElse(null);

        RoutePerformanceSummary routePerformance = RoutePerformanceSummary.builder()
                .totalRoutes(routes.size())
                .avgDistanceKm(avgDistance)
                .avgEstimatedMinutes(avgEstimated)
                .avgActualMinutes(avgActual)
                .avgVarianceMinutes(avgVariance)
                .timeEstimateAccuracyPercent(timeEstimateAccuracyPercent)
                .bestPerformingRoute(bestRoute)
                .worstPerformingRoute(worstRoute)
                .build();

        long pendingPod = podRepository.countByVerificationStatus("PENDING");
        long atRisk = etaPredictionRepository.findAll().stream()
                .filter(p -> p.getDelayRiskScore() != null && p.getDelayRiskScore().doubleValue() >= delayRiskThreshold)
                .count();

        SystemMonitoringSummary systemMonitoring = SystemMonitoringSummary.builder()
                .pendingPodVerifications(pendingPod)
                .atRiskShipmentCount(atRisk)
                .build();

        return AdminAnalyticsResponse.builder()
                .userSummary(userSummary)
                .overview(overview)
                .routePerformance(routePerformance)
                .systemMonitoring(systemMonitoring)
                .availableReportTypes(REPORT_TYPES)
                .build();
    }

    private Double average(java.util.stream.Stream<Double> values) {
        List<Double> list = values.toList();
        return list.isEmpty() ? null : list.stream().mapToDouble(Double::doubleValue).average().orElse(0);
    }

    /** accuracyPercent = 100 - |actual - estimated| / estimated * 100, clamped to [0, 100]. 100 = actual matched the estimate exactly. */
    private RouteAnalyticsEntry toAnalyticsEntry(Route r, Shipment shipment) {
        int variance = r.getActualTimeMinutes() - r.getEstimatedTimeMinutes();
        double rawAccuracy = 100.0 - (Math.abs(variance) / (double) r.getEstimatedTimeMinutes()) * 100.0;
        double accuracy = Math.max(0.0, Math.min(100.0, rawAccuracy));

        return new RouteAnalyticsEntry(
                r.getId(),
                r.getShipmentId(),
                shipment == null ? null : shipment.getTrackingNumber(),
                r.getOrigin(),
                r.getDestination(),
                r.getDistanceKm(),
                r.getEstimatedTimeMinutes(),
                r.getActualTimeMinutes(),
                variance,
                Math.round(accuracy * 100.0) / 100.0
        );
    }

    private ShipmentSummary toSummary(Shipment s) {
        return ShipmentSummary.builder()
                .id(s.getId())
                .trackingNumber(s.getTrackingNumber())
                .status(s.getStatus())
                .priority(s.getPriority())
                .receiverName(s.getReceiverName())
                .createdAt(s.getCreatedAt())
                .estimatedDeliveryDate(s.getEstimatedDeliveryDate())
                .actualDeliveryDate(s.getActualDeliveryDate())
                .build();
    }

    private DashboardAnalyticsResponse buildAnalytics(List<Shipment> shipments) {
        Map<String, Long> byStatus = shipments.stream()
                .collect(Collectors.groupingBy(Shipment::getStatus, Collectors.counting()));

        long delivered = byStatus.getOrDefault("DELIVERED", 0L);
        long onTime = shipments.stream()
                .filter(s -> "DELIVERED".equals(s.getStatus())
                        && s.getActualDeliveryDate() != null
                        && s.getEstimatedDeliveryDate() != null
                        && !s.getActualDeliveryDate().isAfter(s.getEstimatedDeliveryDate()))
                .count();
        long late = delivered - onTime;

        long cancelled = byStatus.getOrDefault("CANCELLED", 0L);
        long active = shipments.size() - delivered - cancelled
                - byStatus.getOrDefault("FAILED_DELIVERY", 0L);

        double onTimeRate = delivered == 0 ? 0.0 : (onTime * 100.0) / delivered;

        return DashboardAnalyticsResponse.builder()
                .totalShipments(shipments.size())
                .shipmentsByStatus(byStatus)
                .deliveredOnTime(onTime)
                .deliveredLate(late)
                .onTimeDeliveryRate(Math.round(onTimeRate * 100.0) / 100.0)
                .activeShipments(Math.max(active, 0))
                .cancelledShipments(cancelled)
                .build();
    }
}
