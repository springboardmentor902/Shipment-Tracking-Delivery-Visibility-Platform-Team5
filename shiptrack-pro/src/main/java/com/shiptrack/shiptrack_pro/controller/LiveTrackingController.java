package com.shiptrack.shiptrack_pro.controller;

import com.shiptrack.shiptrack_pro.dto.LiveLocationUpdate;
import com.shiptrack.shiptrack_pro.dto.RouteLocationRequest;
import com.shiptrack.shiptrack_pro.service.LiveTrackingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/routes")
@RequiredArgsConstructor
public class LiveTrackingController {

    private final LiveTrackingService liveTrackingService;

    @PostMapping("/{routeId}/location")
    public ResponseEntity<LiveLocationUpdate> updateLocation(
            @PathVariable Long routeId,
            @Valid @RequestBody RouteLocationRequest request) {

        return ResponseEntity.ok(
                liveTrackingService.updateLocation(routeId, request)
        );
    }
}