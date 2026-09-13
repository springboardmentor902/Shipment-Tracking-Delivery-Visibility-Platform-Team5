package com.shiptrack.shiptrack_pro.service;

import com.shiptrack.shiptrack_pro.dto.DriverLocationRequest;
import com.shiptrack.shiptrack_pro.dto.RouteRequest;
import com.shiptrack.shiptrack_pro.dto.RouteResponse;

import java.util.List;

public interface RouteService {
    /** Creates a new route for a shipment, using Route Optimization to auto-fill distance/time/traffic when not supplied, and marks it the current route (flipping any previous current route to false - a re-route). */
    RouteResponse planRoute(Long shipmentId, RouteRequest request);

    /** The single active route for a shipment (isCurrent=true). 404 if none exists yet. */
    RouteResponse getCurrentRoute(Long shipmentId);

    /** Every route ever planned for a shipment, oldest first - the full re-route history. */
    List<RouteResponse> getRouteHistory(Long shipmentId);

    RouteResponse completeRoute(Long routeId, Integer actualTimeMinutes);

    /** Saves the driver's current position on the route and broadcasts it over STOMP. */
    RouteResponse updateDriverLocation(Long routeId, DriverLocationRequest request);
}
