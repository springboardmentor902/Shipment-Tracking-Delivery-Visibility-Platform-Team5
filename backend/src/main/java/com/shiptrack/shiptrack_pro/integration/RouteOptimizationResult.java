package com.shiptrack.shiptrack_pro.integration;

import java.util.List;

/** What RouteOptimizationService hands back: the chosen alternative, why it was chosen, and everything it was chosen from. */
public record RouteOptimizationResult(
        RouteAlternativeDTO selected,
        String reason,
        List<RouteAlternativeDTO> allAlternatives
) {
}
