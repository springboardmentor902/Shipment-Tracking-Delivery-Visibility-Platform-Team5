package com.shiptrack.shiptrack_pro.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoutePerformanceSummary {
    private long totalRoutes;
    private Double avgDistanceKm;
    private Double avgEstimatedMinutes;
    private Double avgActualMinutes;
    /** avgActualMinutes - avgEstimatedMinutes, over routes where both are present - positive means routes are running long. */
    private Double avgVarianceMinutes;

    /**
     * Route Analytics: how close estimates come to reality, and which routes were the best
     * and worst examples of that - computed only over completed routes (both
     * estimatedTimeMinutes and actualTimeMinutes present).
     */
    private Double timeEstimateAccuracyPercent;
    private RouteAnalyticsEntry bestPerformingRoute;
    private RouteAnalyticsEntry worstPerformingRoute;
}
