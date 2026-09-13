package com.shiptrack.shiptrack_pro.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RouteResponse {
    private Long id;
    private Long shipmentId;
    private Long driverId;
    private String origin;
    private String destination;
    private String waypoints;
    private BigDecimal distanceKm;
    private Integer estimatedTimeMinutes;
    private Integer actualTimeMinutes;
    private String trafficCondition;
    private BigDecimal lastKnownLatitude;
    private BigDecimal lastKnownLongitude;
    private LocalDateTime lastLocationUpdatedAt;
    private LocalDateTime createdAt;
    private Boolean isCurrent;
    private String selectionReason;
}
