package com.shiptrack.shiptrack_pro.controller;

import com.shiptrack.shiptrack_pro.entity.Shipment;
import com.shiptrack.shiptrack_pro.service.GoogleMapsService;
import com.shiptrack.shiptrack_pro.service.ShipmentService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/shipments")
public class ShipmentController {

    private final ShipmentService shipmentService;
    private final GoogleMapsService googleMapsService;

    public ShipmentController(
            ShipmentService shipmentService,
            GoogleMapsService googleMapsService) {

        this.shipmentService = shipmentService;
        this.googleMapsService = googleMapsService;
    }

    @PostMapping
    public ResponseEntity<Shipment> createShipment(
            @RequestBody Shipment shipment,
            Authentication authentication) {

        return ResponseEntity.ok(
                shipmentService.createShipment(
                        shipment,
                        authentication.getName()
                )
        );
    }

    @GetMapping
    public ResponseEntity<List<Shipment>> getAllShipments(
            Authentication authentication) {

        return ResponseEntity.ok(
                shipmentService.getShipmentsForUser(
                        authentication.getName()
                )
        );
    }

    @GetMapping("/distance")
    public ResponseEntity<String> getDistance(
            @RequestParam String origin,
            @RequestParam String destination) {

        return ResponseEntity.ok(
                googleMapsService.getDistance(
                        origin,
                        destination
                )
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<Shipment> getShipmentById(
            @PathVariable Long id,
            Authentication authentication) {

        return ResponseEntity.ok(
                shipmentService.getShipmentByIdForUser(
                        id,
                        authentication.getName()
                )
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<Shipment> updateShipment(
            @PathVariable Long id,
            @RequestBody Shipment shipment) {

        return ResponseEntity.ok(
                shipmentService.updateShipment(id, shipment)
        );
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Shipment> updateStatus(
            @PathVariable Long id,
            @RequestParam String status) {

        return ResponseEntity.ok(
                shipmentService.updateStatus(id, status)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> cancelShipment(
            @PathVariable Long id) {

        shipmentService.cancelShipment(id);

        return ResponseEntity.ok(
                "Shipment cancelled successfully"
        );
    }
}