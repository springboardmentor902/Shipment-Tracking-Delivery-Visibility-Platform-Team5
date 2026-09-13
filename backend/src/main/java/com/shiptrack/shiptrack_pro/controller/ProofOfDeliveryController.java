package com.shiptrack.shiptrack_pro.controller;

import com.shiptrack.shiptrack_pro.dto.ProofOfDeliveryRequest;
import com.shiptrack.shiptrack_pro.dto.ProofOfDeliveryResponse;
import com.shiptrack.shiptrack_pro.security.CurrentUser;
import com.shiptrack.shiptrack_pro.service.ProofOfDeliveryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/** Proof of Delivery Module (PDF 4.8) - submission by a Logistics Operator, verification by Admin/Support. */
@RestController
@RequestMapping("/api/pod")
@RequiredArgsConstructor
public class ProofOfDeliveryController {

    private final ProofOfDeliveryService proofOfDeliveryService;
    private final CurrentUser currentUser;

    @PostMapping("/{shipmentId}")
    public ResponseEntity<ProofOfDeliveryResponse> submit(@PathVariable Long shipmentId,
                                                             @Valid @RequestBody ProofOfDeliveryRequest request) {
        ProofOfDeliveryResponse response = proofOfDeliveryService.submitPod(shipmentId, currentUser.id(), request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    /** Spec asks for PATCH specifically; PUT is kept as a separate mapping for backward compatibility. */
    @PutMapping("/{shipmentId}/verify")
    @PreAuthorize("hasAnyRole('ADMINISTRATOR', 'SUPPORT_AGENT')")
    public ResponseEntity<ProofOfDeliveryResponse> verifyPut(@PathVariable Long shipmentId, @RequestBody Map<String, Boolean> body) {
        return verify(shipmentId, body);
    }

    @PatchMapping("/{shipmentId}/verify")
    @PreAuthorize("hasAnyRole('ADMINISTRATOR', 'SUPPORT_AGENT')")
    public ResponseEntity<ProofOfDeliveryResponse> verifyPatch(@PathVariable Long shipmentId, @RequestBody Map<String, Boolean> body) {
        return verify(shipmentId, body);
    }

    private ResponseEntity<ProofOfDeliveryResponse> verify(Long shipmentId, Map<String, Boolean> body) {
        boolean approved = Boolean.TRUE.equals(body.getOrDefault("approved", true));
        return ResponseEntity.ok(proofOfDeliveryService.verifyPod(shipmentId, currentUser.id(), approved));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('ADMINISTRATOR', 'SUPPORT_AGENT')")
    public ResponseEntity<java.util.List<ProofOfDeliveryResponse>> pending() {
        return ResponseEntity.ok(proofOfDeliveryService.getPendingVerification());
    }

    @GetMapping("/{shipmentId}")
    public ResponseEntity<ProofOfDeliveryResponse> get(@PathVariable Long shipmentId) {
        return ResponseEntity.ok(proofOfDeliveryService.getForShipment(
                shipmentId, currentUser.id(), currentUser.get().getRole()));
    }
}
