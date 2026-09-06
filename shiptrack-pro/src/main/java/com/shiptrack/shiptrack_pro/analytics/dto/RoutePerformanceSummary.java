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
public class RoutePerformanceSummary {

    private Long routeId;

    private Long shipmentId;

    private String origin;

    private String destination;

    private BigDecimal distanceKm;

    private Integer estimatedTimeMinutes;

    private Integer actualTimeMinutes;

    private BigDecimal accuracyPercentage;
}