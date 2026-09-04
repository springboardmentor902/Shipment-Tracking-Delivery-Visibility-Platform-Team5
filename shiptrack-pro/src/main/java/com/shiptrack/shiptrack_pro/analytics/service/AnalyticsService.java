package com.shiptrack.shiptrack_pro.analytics.service;

import com.shiptrack.shiptrack_pro.analytics.dto.AdminAnalyticsResponse;
import com.shiptrack.shiptrack_pro.analytics.dto.BusinessAnalyticsResponse;
import com.shiptrack.shiptrack_pro.analytics.dto.CustomerAnalyticsResponse;

public interface AnalyticsService {

    CustomerAnalyticsResponse getCustomerAnalytics(
            String email
    );

    BusinessAnalyticsResponse getBusinessAnalytics(
            String email
    );

    AdminAnalyticsResponse getAdminAnalytics(
            String email
    );
}