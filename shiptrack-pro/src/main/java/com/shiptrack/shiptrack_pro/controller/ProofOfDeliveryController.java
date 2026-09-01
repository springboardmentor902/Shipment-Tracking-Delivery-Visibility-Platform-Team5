package com.shiptrack.shiptrack_pro.controller;

import com.shiptrack.shiptrack_pro.entity.ProofOfDelivery;
import com.shiptrack.shiptrack_pro.service.ProofOfDeliveryService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import org.springframework.security.core.Authentication;

import org.springframework.web.bind.annotation.*;

import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/pod")
@RequiredArgsConstructor
public class ProofOfDeliveryController {


    private final ProofOfDeliveryService proofOfDeliveryService;


    // =========================================================
    // SUBMIT POD
    // =========================================================

    @PostMapping(
            value = "/{shipmentId}",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<ProofOfDelivery> submitProof(

            @PathVariable Long shipmentId,

            @RequestParam String deliveredToName,

            @RequestParam(required = false)
            String deliveryNotes,

            @RequestParam MultipartFile signature,

            @RequestParam MultipartFile photo,

            Authentication authentication) {

        return ResponseEntity.ok(
                proofOfDeliveryService.submitProof(
                        shipmentId,
                        deliveredToName,
                        deliveryNotes,
                        signature,
                        photo,
                        authentication.getName()
                )
        );
    }


    // =========================================================
    // PENDING VERIFICATION QUEUE
    // =========================================================

    @GetMapping("/verification/pending")
    public ResponseEntity<List<ProofOfDelivery>>
    getPendingProofs(
            Authentication authentication) {

        return ResponseEntity.ok(
                proofOfDeliveryService.getPendingProofs(
                        authentication.getName()
                )
        );
    }


    // =========================================================
    // APPROVE POD
    // =========================================================

    @PatchMapping("/{shipmentId}/verify")
    public ResponseEntity<ProofOfDelivery> verifyProof(

            @PathVariable Long shipmentId,

            Authentication authentication) {

        return ResponseEntity.ok(
                proofOfDeliveryService.verifyProof(
                        shipmentId,
                        authentication.getName()
                )
        );
    }


    // =========================================================
    // REJECT POD
    // =========================================================

    @PatchMapping("/{shipmentId}/reject")
    public ResponseEntity<ProofOfDelivery> rejectProof(

            @PathVariable Long shipmentId,

            Authentication authentication) {

        return ResponseEntity.ok(
                proofOfDeliveryService.rejectProof(
                        shipmentId,
                        authentication.getName()
                )
        );
    }


    // =========================================================
    // GET POD
    // =========================================================

    @GetMapping("/{shipmentId}")
    public ResponseEntity<ProofOfDelivery> getProof(

            @PathVariable Long shipmentId,

            Authentication authentication) {

        return ResponseEntity.ok(
                proofOfDeliveryService.getProof(
                        shipmentId,
                        authentication.getName()
                )
        );
    }
}