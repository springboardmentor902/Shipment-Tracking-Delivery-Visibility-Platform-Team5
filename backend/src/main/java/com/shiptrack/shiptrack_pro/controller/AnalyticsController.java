package com.shiptrack.shiptrack_pro.controller;

import com.shiptrack.shiptrack_pro.dto.AdminAnalyticsResponse;
import com.shiptrack.shiptrack_pro.dto.BusinessAnalyticsResponse;
import com.shiptrack.shiptrack_pro.dto.CustomerAnalyticsResponse;
import com.shiptrack.shiptrack_pro.security.CurrentUser;
import com.shiptrack.shiptrack_pro.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Analytics Dashboard Module - one endpoint per role, each scoped server-side to exactly
 * what that role should see (own shipments / own business / platform-wide). The old
 * GET /api/analytics/overview and GET /api/analytics/business/{businessId} endpoints have
 * been retired: /business/{businessId} took an arbitrary path parameter with no ownership
 * check (any BUSINESS_CLIENT could view any business's data by guessing an id) and wasn't
 * actually used by the frontend - these self-scoped replacements close that gap by never
 * taking the id as input at all.
 */
@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;
    private final CurrentUser currentUser;

    @GetMapping("/customer")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<CustomerAnalyticsResponse> customer() {
        return ResponseEntity.ok(analyticsService.getCustomerAnalytics(currentUser.id()));
    }

    @GetMapping("/business")
    @PreAuthorize("hasRole('BUSINESS_CLIENT')")
    public ResponseEntity<BusinessAnalyticsResponse> business() {
        return ResponseEntity.ok(analyticsService.getBusinessAnalyticsForUser(currentUser.id()));
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<AdminAnalyticsResponse> admin() {
        return ResponseEntity.ok(analyticsService.getAdminAnalytics());
    }
}
