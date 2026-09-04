package com.shiptrack.shiptrack_pro.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoutePerformance {

    private Long routeId;

    private Long shipmentId;

    private String origin;

    private String destination;

    private Double distanceKm;

    private Integer estimatedTimeMinutes;

    private Integer actualTimeMinutes;

    private String trafficCondition;

    private String performanceStatus;
}