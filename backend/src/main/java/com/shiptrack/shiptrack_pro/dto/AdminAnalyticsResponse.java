package com.shiptrack.shiptrack_pro.dto;

import lombok.*;

import java.util.List;

/**
 * GET /api/analytics/admin - platform-wide, no ownership filtering. `overview` reuses the
 * existing DashboardAnalyticsResponse aggregation for "platform-wide shipment monitoring"
 * and "delivery analytics".
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminAnalyticsResponse {
    private UserSummary userSummary;
    private DashboardAnalyticsResponse overview;
    private RoutePerformanceSummary routePerformance;
    private SystemMonitoringSummary systemMonitoring;
    /** Report types available on the Reports & Export page - lets the admin dashboard's "reports management" section render links without hardcoding them in the frontend. */
    private List<String> availableReportTypes;
}
