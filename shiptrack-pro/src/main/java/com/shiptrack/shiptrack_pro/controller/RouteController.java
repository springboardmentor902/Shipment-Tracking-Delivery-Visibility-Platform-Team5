package com.shiptrack.shiptrack_pro.controller;

import com.shiptrack.shiptrack_pro.entity.Route;
import com.shiptrack.shiptrack_pro.service.RouteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/routes")
@RequiredArgsConstructor
public class RouteController {

    private final RouteService routeService;

    @PostMapping
    public ResponseEntity<Route> createRoute(
            @RequestBody Route route,
            Authentication authentication) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        routeService.createRoute(
                                route,
                                authentication.getName()
                        )
                );
    }

    /**
     * Returns ONLY the current route.
     */
    @GetMapping("/{shipmentId}")
    public ResponseEntity<List<Route>> getRoutes(
            @PathVariable Long shipmentId,
            Authentication authentication) {

        return ResponseEntity.ok(
                routeService.getRoutesByShipmentId(
                        shipmentId,
                        authentication.getName()
                )
        );
    }

    /**
     * Returns complete route history.
     */
    @GetMapping("/{shipmentId}/history")
    public ResponseEntity<List<Route>> getRouteHistory(
            @PathVariable Long shipmentId,
            Authentication authentication) {

        return ResponseEntity.ok(
                routeService.getRouteHistory(
                        shipmentId,
                        authentication.getName()
                )
        );
    }

    @PatchMapping("/{routeId}")
    public ResponseEntity<Route> updateRoute(
            @PathVariable Long routeId,
            @RequestBody Route route,
            Authentication authentication) {

        return ResponseEntity.ok(
                routeService.updateRoute(
                        routeId,
                        route,
                        authentication.getName()
                )
        );
    }
}