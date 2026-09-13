package com.shiptrack.shiptrack_pro.controller;

import com.shiptrack.shiptrack_pro.dto.DriverLocationRequest;
import com.shiptrack.shiptrack_pro.dto.RouteResponse;
import com.shiptrack.shiptrack_pro.service.RouteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Live Delivery Monitoring Module - the driver-facing endpoint for posting a current
 * position. Deliberately a separate controller at the singular /api/route path (distinct
 * from RouteController's /api/routes) to match the endpoint exactly as specified:
 * POST /api/route/{id}/location, where {id} is the route id.
 */
@RestController
@RequestMapping("/api/route")
@RequiredArgsConstructor
public class DriverLocationController {

    private final RouteService routeService;

    @PostMapping("/{id}/location")
    public ResponseEntity<RouteResponse> updateLocation(@PathVariable Long id,
                                                           @Valid @RequestBody DriverLocationRequest request) {
        return ResponseEntity.ok(routeService.updateDriverLocation(id, request));
    }
}
