package com.shiptrack.shiptrack_pro.service;

import com.shiptrack.shiptrack_pro.dto.RouteRequest;
import com.shiptrack.shiptrack_pro.dto.RouteResponse;

public interface RouteService {

    // Create a new route
    RouteResponse createRoute(
            RouteRequest request
    );

    // Get route using shipment ID
    RouteResponse getRouteByShipmentId(
            Long shipmentId
    );

    // Assign / change driver
    RouteResponse assignDriver(
            Long routeId,
            Long driverId
    );

    // Recalculate an existing route
    RouteResponse recalculateRoute(
            Long routeId
    );
}