package com.shiptrack.shiptrack_pro.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RouteRequest {
    private Long driverId;
    @NotBlank(message = "Origin is required")
    private String origin;
    @NotBlank(message = "Destination is required")
    private String destination;
    private String waypoints;
    private java.math.BigDecimal distanceKm;
    private Integer estimatedTimeMinutes;
    private String trafficCondition;
}
