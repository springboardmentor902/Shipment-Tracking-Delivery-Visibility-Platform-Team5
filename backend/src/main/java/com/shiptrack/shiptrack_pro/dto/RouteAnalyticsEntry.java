package com.shiptrack.shiptrack_pro.dto;

import java.math.BigDecimal;

/** One route in the "best/worst performing" lists - performance = how close the actual time came to the estimate. */
public record RouteAnalyticsEntry(
        Long routeId,
        Long shipmentId,
        String trackingNumber,
        String origin,
        String destination,
        BigDecimal distanceKm,
        Integer estimatedTimeMinutes,
        Integer actualTimeMinutes,
        Integer varianceMinutes,
        Double accuracyPercent
) {
}
