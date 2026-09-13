package com.shiptrack.shiptrack_pro.controller;

import com.shiptrack.shiptrack_pro.dto.RouteRequest;
import com.shiptrack.shiptrack_pro.dto.RouteResponse;
import com.shiptrack.shiptrack_pro.service.RouteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** Route Management Module (PDF 4.7) - route planning, history, and completion tracking. */
@RestController
@RequestMapping("/api/routes")
@RequiredArgsConstructor
public class RouteController {

    private final RouteService routeService;

    @PostMapping("/{shipmentId}")
    public ResponseEntity<RouteResponse> planRoute(@PathVariable Long shipmentId, @Valid @RequestBody RouteRequest request) {
        RouteResponse response = routeService.planRoute(shipmentId, request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/{shipmentId}")
    public ResponseEntity<RouteResponse> getCurrentRoute(@PathVariable Long shipmentId) {
        return ResponseEntity.ok(routeService.getCurrentRoute(shipmentId));
    }

    /** The full re-route history for a shipment, oldest first - one entry per route ever planned. */
    @GetMapping("/{shipmentId}/history")
    public ResponseEntity<List<RouteResponse>> getHistory(@PathVariable Long shipmentId) {
        return ResponseEntity.ok(routeService.getRouteHistory(shipmentId));
    }

    @PutMapping("/{routeId}/complete")
    public ResponseEntity<RouteResponse> completeRoute(@PathVariable Long routeId, @RequestBody Map<String, Integer> body) {
        return ResponseEntity.ok(routeService.completeRoute(routeId, body.get("actualTimeMinutes")));
    }
}
