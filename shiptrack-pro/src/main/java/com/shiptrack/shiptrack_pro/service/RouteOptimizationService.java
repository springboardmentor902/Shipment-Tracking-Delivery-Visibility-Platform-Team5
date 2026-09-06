package com.shiptrack.shiptrack_pro.service;

import com.shiptrack.shiptrack_pro.dto.RouteAlternative;

import java.util.List;

public interface RouteOptimizationService {

    RouteAlternative selectBestRoute(
            String origin,
            String destination
    );

    List<RouteAlternative> getRouteAlternatives(
            String origin,
            String destination
    );
}