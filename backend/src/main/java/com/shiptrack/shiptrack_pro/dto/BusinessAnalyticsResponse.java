package com.shiptrack.shiptrack_pro.dto;

import lombok.*;

/**
 * GET /api/analytics/business - scoped to the logged-in business client's own business
 * only. `overview` reuses the existing DashboardAnalyticsResponse aggregation (shipment
 * counts by status, on-time delivery rate - covers "shipment analytics", "delivery
 * performance", and "logistics overview, including shipment count for each status" in one
 * shared computation), extended with the two things it doesn't already cover.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BusinessAnalyticsResponse {
    private DashboardAnalyticsResponse overview;
    private DelayAnalysis delayAnalysis;
    private CustomerActivitySummary customerActivity;
}
