package com.shiptrack.shiptrack_pro.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RouteAlternative {

    private BigDecimal distanceKm;

    private Integer durationMinutes;

    private Integer trafficAdjustedDurationMinutes;

    private String summary;

    private String selectionReason;
}