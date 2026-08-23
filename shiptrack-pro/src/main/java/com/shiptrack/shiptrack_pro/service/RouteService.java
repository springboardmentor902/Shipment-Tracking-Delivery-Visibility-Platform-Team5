package com.shiptrack.shiptrack_pro.service;

import com.shiptrack.shiptrack_pro.entity.Route;

import java.util.List;

public interface RouteService {

    Route createRoute(Route route, String email);

    List<Route> getRoutesByShipmentId(Long shipmentId, String email);

    Route updateRoute(Long routeId, Route updatedRoute, String email);
}