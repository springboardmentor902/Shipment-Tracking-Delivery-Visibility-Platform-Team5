package com.shiptrack.shiptrack_pro.integration;

import java.util.Optional;

public interface RouteOptimizationService {

    /**
     * Fetches every route alternative Google offers between the two addresses and selects
     * the one with the lowest traffic-adjusted duration (falling back to the plain
     * estimated duration for any alternative Google didn't return traffic data for).
     * Returns Optional.empty() if Maps is unreachable/unconfigured or no alternatives come
     * back - RouteServiceImpl falls back to a single-estimate lookup in that case, so a
     * route can always be saved regardless.
     */
    Optional<RouteOptimizationResult> selectBestRoute(String originAddress, String destinationAddress);
}
