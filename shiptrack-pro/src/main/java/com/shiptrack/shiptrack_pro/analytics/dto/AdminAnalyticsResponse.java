package com.shiptrack.shiptrack_pro.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminAnalyticsResponse {

    private long totalUsers;

    private long totalCustomers;

    private long totalBusinessClients;

    private long totalLogisticsOperators;

    private long totalSupportAgents;

    private long totalShipments;

    private long activeShipments;

    private long deliveredShipments;

    private long delayedShipments;

    private double deliverySuccessRate;

    private double averageDeliveryTimeDays;

    private Map<String, Long> shipmentStatusBreakdown;

    private List<RoutePerformance> routePerformance;

    private SystemMonitoring systemMonitoring;

    private ReportsSummary reports;
}