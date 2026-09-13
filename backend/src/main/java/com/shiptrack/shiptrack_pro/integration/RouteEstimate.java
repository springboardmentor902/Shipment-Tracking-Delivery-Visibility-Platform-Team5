package com.shiptrack.shiptrack_pro.integration;

import java.math.BigDecimal;

/** The distance/time estimate returned by the Directions API for one origin-destination pair. */
public record RouteEstimate(BigDecimal distanceKm, Integer durationMinutes) {
}
