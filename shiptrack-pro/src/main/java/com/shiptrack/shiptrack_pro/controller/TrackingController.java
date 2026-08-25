package com.shiptrack.shiptrack_pro.controller;

import com.shiptrack.shiptrack_pro.dto.TrackingEventRequest;
import com.shiptrack.shiptrack_pro.entity.TrackingEvent;
import com.shiptrack.shiptrack_pro.service.TrackingEventService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tracking")
@RequiredArgsConstructor
public class TrackingController {

    private final TrackingEventService trackingEventService;

    @PostMapping("/{shipmentId}/events")
    public ResponseEntity<TrackingEvent> addEvent(
            @PathVariable Long shipmentId,
            @RequestBody TrackingEventRequest request) {

        return ResponseEntity.ok(
                trackingEventService.addEvent(shipmentId, request)
        );
    }

    @GetMapping("/{shipmentId}/history")
    public ResponseEntity<List<TrackingEvent>> getHistory(
            @PathVariable Long shipmentId) {

        return ResponseEntity.ok(
                trackingEventService.getHistory(shipmentId)
        );
    }
}