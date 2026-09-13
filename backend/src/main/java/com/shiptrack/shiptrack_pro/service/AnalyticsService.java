package com.shiptrack.shiptrack_pro.service;

import com.shiptrack.shiptrack_pro.dto.AdminAnalyticsResponse;
import com.shiptrack.shiptrack_pro.dto.BusinessAnalyticsResponse;
import com.shiptrack.shiptrack_pro.dto.CustomerAnalyticsResponse;
import com.shiptrack.shiptrack_pro.dto.DashboardAnalyticsResponse;

public interface AnalyticsService {
    DashboardAnalyticsResponse getOverallAnalytics();
    DashboardAnalyticsResponse getAnalyticsForBusiness(Long businessId);

    /** GET /api/analytics/customer - scoped to this user's own shipments (createdBy). */
    CustomerAnalyticsResponse getCustomerAnalytics(Long userId);

    /** GET /api/analytics/business - scoped to this user's own BusinessAccount. */
    BusinessAnalyticsResponse getBusinessAnalyticsForUser(Long userId);

    /** GET /api/analytics/admin - platform-wide, no ownership filtering. */
    AdminAnalyticsResponse getAdminAnalytics();
}
