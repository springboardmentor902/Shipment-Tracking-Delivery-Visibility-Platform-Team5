package com.shiptrack.shiptrack_pro.controller;

import com.shiptrack.shiptrack_pro.dto.TrackingEventRequest;
import com.shiptrack.shiptrack_pro.dto.TrackingEventResponse;
import com.shiptrack.shiptrack_pro.security.CurrentUser;
import com.shiptrack.shiptrack_pro.service.TrackingEventService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Shipment Tracking Module (PDF 4.4) - live status/location updates and the tracking timeline. */
@RestController
@RequestMapping("/api/tracking")
@RequiredArgsConstructor
public class TrackingEventController {

    private final TrackingEventService trackingEventService;
    private final CurrentUser currentUser;

    @PostMapping("/{shipmentId}/events")
    public ResponseEntity<TrackingEventResponse> addEvent(@PathVariable Long shipmentId,
                                                             @Valid @RequestBody TrackingEventRequest request) {
        TrackingEventResponse response = trackingEventService.addEvent(shipmentId, currentUser.id(), request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/{shipmentId}/timeline")
    public ResponseEntity<List<TrackingEventResponse>> getTimeline(@PathVariable Long shipmentId) {
        return ResponseEntity.ok(trackingEventService.getTimeline(shipmentId));
    }

    @GetMapping("/{shipmentId}/latest")
    public ResponseEntity<TrackingEventResponse> getLatest(@PathVariable Long shipmentId) {
        return ResponseEntity.ok(trackingEventService.getLatest(shipmentId));
    }
}
