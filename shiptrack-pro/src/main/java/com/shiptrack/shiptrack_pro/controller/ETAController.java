package com.shiptrack.shiptrack_pro.controller;

import com.shiptrack.shiptrack_pro.entity.ETAPrediction;
import com.shiptrack.shiptrack_pro.service.ETAService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/eta")
@RequiredArgsConstructor
public class ETAController {

    private final ETAService etaService;

    @PostMapping("/{shipmentId}/predict")
    public ResponseEntity<ETAPrediction> predictETA(
            @PathVariable Long shipmentId) {

        return ResponseEntity.ok(
                etaService.calculateAndSave(shipmentId)
        );
    }

    @GetMapping("/{shipmentId}")
    public ResponseEntity<ETAPrediction> getETA(
            @PathVariable Long shipmentId) {

        return ResponseEntity.ok(
                etaService.getPrediction(shipmentId)
        );
    }
}