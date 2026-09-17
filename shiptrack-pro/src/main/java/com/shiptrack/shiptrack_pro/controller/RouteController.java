package com.shiptrack.shiptrack_pro.controller;

import com.shiptrack.shiptrack_pro.dto.RouteRequest;
import com.shiptrack.shiptrack_pro.dto.RouteResponse;
import com.shiptrack.shiptrack_pro.service.RouteService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/routes")
@RequiredArgsConstructor
public class RouteController {

    private final RouteService routeService;

    // =====================================================
    // CREATE ROUTE
    // POST /api/routes
    // =====================================================

    @PostMapping
    public ResponseEntity<RouteResponse> createRoute(
            @RequestBody RouteRequest request) {

        RouteResponse response =
                routeService.createRoute(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    // =====================================================
    // GET ROUTE BY SHIPMENT
    // GET /api/routes/{shipmentId}
    // =====================================================

    @GetMapping("/{shipmentId}")
    public ResponseEntity<RouteResponse> getRouteByShipmentId(
            @PathVariable Long shipmentId) {

        return ResponseEntity.ok(
                routeService.getRouteByShipmentId(
                        shipmentId
                )
        );
    }

    // =====================================================
    // ASSIGN / CHANGE DRIVER
    // PUT /api/routes/{routeId}/driver/{driverId}
    // =====================================================

    @PutMapping("/{routeId}/driver/{driverId}")
    public ResponseEntity<RouteResponse> assignDriver(
            @PathVariable Long routeId,
            @PathVariable Long driverId) {

        return ResponseEntity.ok(
                routeService.assignDriver(
                        routeId,
                        driverId
                )
        );
    }
    @PostMapping("/{routeId}/recalculate")
    public ResponseEntity<RouteResponse> recalculateRoute(
            @PathVariable Long routeId) {

        return ResponseEntity.ok(
                routeService.recalculateRoute(
                        routeId
                )
        );
    }
}