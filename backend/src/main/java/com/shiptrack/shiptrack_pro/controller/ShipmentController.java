package com.shiptrack.shiptrack_pro.controller;

import com.shiptrack.shiptrack_pro.dto.*;
import com.shiptrack.shiptrack_pro.security.CurrentUser;
import com.shiptrack.shiptrack_pro.service.ShipmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** Shipment Management Module (PDF 4.3) - the core CRUD + lifecycle endpoints for shipments. */
@RestController
@RequestMapping("/api/shipments")
@RequiredArgsConstructor
public class ShipmentController {

    private final ShipmentService shipmentService;
    private final CurrentUser currentUser;

    @PostMapping
    public ResponseEntity<ShipmentResponse> create(@Valid @RequestBody ShipmentCreateRequest request) {
        ShipmentResponse response = shipmentService.createShipment(currentUser.email(), request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ShipmentResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(shipmentService.getById(id));
    }

    /** Public tracking lookup - no shipment details are hidden behind auth for the customer tracking page. */
    @GetMapping("/track/{trackingNumber}")
    public ResponseEntity<ShipmentResponse> track(@PathVariable String trackingNumber) {
        return ResponseEntity.ok(shipmentService.getByTrackingNumber(trackingNumber));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<List<ShipmentResponse>> getAll() {
        return ResponseEntity.ok(shipmentService.getAll());
    }

    @GetMapping("/my")
    public ResponseEntity<List<ShipmentResponse>> getMine() {
        return ResponseEntity.ok(shipmentService.getForCurrentUser(currentUser.email()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ShipmentResponse> update(@PathVariable Long id, @RequestBody ShipmentUpdateRequest request) {
        return ResponseEntity.ok(shipmentService.updateShipment(id, request));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('LOGISTICS_OPERATOR', 'ADMINISTRATOR', 'BUSINESS_CLIENT')")
    public ResponseEntity<ShipmentResponse> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String status = body.get("status");
        String role = currentUser.get().getRole();
        return ResponseEntity.ok(shipmentService.updateStatus(id, status, currentUser.id(), role));
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<ShipmentResponse> cancel(@PathVariable Long id, @Valid @RequestBody ShipmentCancelRequest request) {
        return ResponseEntity.ok(shipmentService.cancelShipment(id, request));
    }

    @PutMapping("/{id}/assign-operator/{operatorId}")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<ShipmentResponse> assignOperator(@PathVariable Long id, @PathVariable Long operatorId) {
        return ResponseEntity.ok(shipmentService.assignOperator(id, operatorId));
    }
}
