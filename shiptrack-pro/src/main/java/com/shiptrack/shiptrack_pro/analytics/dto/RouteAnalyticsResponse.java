package com.shiptrack.shiptrack_pro.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RouteAnalyticsResponse {

    private BigDecimal averageRouteDistanceKm;

    private BigDecimal timeEstimateAccuracyPercentage;

    private RoutePerformanceSummary bestPerformingRoute;

    private RoutePerformanceSummary worstPerformingRoute;

    private long totalRoutes;
}