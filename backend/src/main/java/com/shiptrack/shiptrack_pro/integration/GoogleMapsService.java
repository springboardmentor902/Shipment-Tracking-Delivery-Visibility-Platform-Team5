package com.shiptrack.shiptrack_pro.integration;

import java.util.List;
import java.util.Optional;

/**
 * Wraps Google's Geocoding + Directions APIs. Every method returns Optional.empty() (or an
 * empty List, for the alternatives methods) instead of throwing when the call fails or
 * isn't configured - callers (RouteService) must be able to save a route successfully even
 * when Maps is unreachable, per the "never fail the whole request" requirement.
 */
public interface GoogleMapsService {

    /** Converts a free-text address into coordinates via the Geocoding API. */
    Optional<GeoPoint> geocode(String address);

    /** Calculates driving distance/duration between two coordinates via the Directions API. */
    Optional<RouteEstimate> getDirections(GeoPoint origin, GeoPoint destination);

    /**
     * Convenience wrapper: geocodes both addresses, then fetches directions between them.
     * Returns Optional.empty() if either address fails to geocode or Directions fails -
     * never throws.
     */
    Optional<RouteEstimate> estimateRoute(String originAddress, String destinationAddress);

    /**
     * Route Optimization: fetches every alternative route Google offers between two
     * coordinates (alternatives=true), each with the current departure_time so
     * duration_in_traffic (traffic-adjusted duration) is populated where Google has data
     * for it. Returns an empty list rather than throwing if Maps is unreachable or
     * unconfigured - RouteOptimizationService treats an empty list as "nothing to select
     * from" and its caller falls back to a single-estimate lookup.
     */
    List<RouteAlternativeDTO> getRouteAlternatives(GeoPoint origin, GeoPoint destination);

    /** Convenience wrapper: geocodes both addresses, then fetches alternatives between them. */
    List<RouteAlternativeDTO> estimateRouteAlternatives(String originAddress, String destinationAddress);
}
