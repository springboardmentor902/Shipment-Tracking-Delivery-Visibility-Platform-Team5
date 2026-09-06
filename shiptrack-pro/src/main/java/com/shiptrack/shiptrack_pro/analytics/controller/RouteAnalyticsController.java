package com.shiptrack.shiptrack_pro.analytics.controller;

import com.shiptrack.shiptrack_pro.analytics.dto.RouteAnalyticsResponse;
import com.shiptrack.shiptrack_pro.analytics.service.RouteAnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/analytics/routes")
@RequiredArgsConstructor
public class RouteAnalyticsController {

    private final RouteAnalyticsService routeAnalyticsService;

    @GetMapping
    public ResponseEntity<RouteAnalyticsResponse>
    getRouteAnalytics() {

        return ResponseEntity.ok(
                routeAnalyticsService.getRouteAnalytics()
        );
    }
}