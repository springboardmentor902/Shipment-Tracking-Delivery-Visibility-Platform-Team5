package com.shiptrack.shiptrack_pro.analytics.controller;

import com.shiptrack.shiptrack_pro.analytics.dto.AdminAnalyticsResponse;
import com.shiptrack.shiptrack_pro.analytics.dto.BusinessAnalyticsResponse;
import com.shiptrack.shiptrack_pro.analytics.dto.CustomerAnalyticsResponse;
import com.shiptrack.shiptrack_pro.analytics.service.AnalyticsService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/customer")
    public ResponseEntity<CustomerAnalyticsResponse>
    getCustomerAnalytics(
            Authentication authentication) {

        return ResponseEntity.ok(
                analyticsService.getCustomerAnalytics(
                        authentication.getName()
                )
        );
    }

    @GetMapping("/business")
    public ResponseEntity<BusinessAnalyticsResponse>
    getBusinessAnalytics(
            Authentication authentication) {

        return ResponseEntity.ok(
                analyticsService.getBusinessAnalytics(
                        authentication.getName()
                )
        );
    }

    @GetMapping("/admin")
    public ResponseEntity<AdminAnalyticsResponse>
    getAdminAnalytics(
            Authentication authentication) {

        return ResponseEntity.ok(
                analyticsService.getAdminAnalytics(
                        authentication.getName()
                )
        );
    }
}