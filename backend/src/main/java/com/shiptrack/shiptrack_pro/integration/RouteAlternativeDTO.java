package com.shiptrack.shiptrack_pro.integration;

import java.math.BigDecimal;

/**
 * One candidate route returned by Google's Directions API when alternatives=true is set.
 * trafficAdjustedDurationMinutes is null when Google has no traffic data for that
 * particular alternative (it requires departure_time to be set, and isn't guaranteed for
 * every road segment) - RouteOptimizationService falls back to durationMinutes when it's
 * absent rather than failing.
 */
public record RouteAlternativeDTO(
        BigDecimal distanceKm,
        Integer durationMinutes,
        Integer trafficAdjustedDurationMinutes,
        String summary
) {
}
