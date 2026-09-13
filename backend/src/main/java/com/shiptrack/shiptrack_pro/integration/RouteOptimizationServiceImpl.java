package com.shiptrack.shiptrack_pro.integration;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;

/**
 * Route Optimization: asks GoogleMapsService for every alternative between two addresses,
 * then picks the one with the lowest traffic-adjusted duration - falling back to an
 * alternative's plain estimated duration when Google didn't return traffic data for it
 * specifically (duration_in_traffic isn't guaranteed for every road segment).
 */
@Service
@RequiredArgsConstructor
public class RouteOptimizationServiceImpl implements RouteOptimizationService {

    private final GoogleMapsService googleMapsService;

    @Override
    public Optional<RouteOptimizationResult> selectBestRoute(String originAddress, String destinationAddress) {
        List<RouteAlternativeDTO> alternatives = googleMapsService.estimateRouteAlternatives(originAddress, destinationAddress);

        if (alternatives.isEmpty()) {
            return Optional.empty();
        }

        RouteAlternativeDTO best = alternatives.stream()
                .min(Comparator.comparingInt(RouteOptimizationServiceImpl::effectiveDurationMinutes))
                .orElseThrow(); // safe - list already confirmed non-empty above

        String reason = buildReason(best, alternatives);

        return Optional.of(new RouteOptimizationResult(best, reason, alternatives));
    }

    /** Traffic-adjusted duration when Google provided it, otherwise the plain estimated duration. */
    private static int effectiveDurationMinutes(RouteAlternativeDTO alt) {
        return alt.trafficAdjustedDurationMinutes() != null ? alt.trafficAdjustedDurationMinutes() : alt.durationMinutes();
    }

    private String buildReason(RouteAlternativeDTO best, List<RouteAlternativeDTO> all) {
        String routeLabel = best.summary() != null && !best.summary().isBlank() ? " via " + best.summary() : "";

        if (all.size() == 1) {
            return "Only one route was available from Google Maps" + routeLabel + ".";
        }

        if (best.trafficAdjustedDurationMinutes() != null) {
            return String.format(
                    "Selected%s for the lowest traffic-adjusted duration (%d min) among %d alternatives.",
                    routeLabel, best.trafficAdjustedDurationMinutes(), all.size());
        }

        return String.format(
                "Selected%s for the lowest estimated duration (%d min) among %d alternatives; " +
                        "live traffic data was not available for this route.",
                routeLabel, best.durationMinutes(), all.size());
    }
}
