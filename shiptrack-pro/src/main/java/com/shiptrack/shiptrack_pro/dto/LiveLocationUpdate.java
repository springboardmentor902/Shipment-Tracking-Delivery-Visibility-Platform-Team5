package com.shiptrack.shiptrack_pro.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LiveLocationUpdate {

    private Long routeId;
    private Long shipmentId;
    private Long driverId;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private String location;
    private LocalDateTime updatedAt;
}