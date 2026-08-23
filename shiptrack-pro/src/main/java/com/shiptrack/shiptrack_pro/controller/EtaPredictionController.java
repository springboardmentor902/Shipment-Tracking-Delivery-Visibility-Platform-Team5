package com.shiptrack.shiptrack_pro.controller;

import com.shiptrack.shiptrack_pro.entity.EtaPrediction;
import com.shiptrack.shiptrack_pro.service.EtaPredictionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/eta")
@RequiredArgsConstructor
public class EtaPredictionController {

    private final EtaPredictionService etaPredictionService;

    @GetMapping("/{shipmentId}")
    public ResponseEntity<EtaPrediction> getEtaPrediction(
            @PathVariable Long shipmentId) {

        return ResponseEntity.ok(
                etaPredictionService.getEtaPrediction(shipmentId)
        );
    }

    @PostMapping("/{shipmentId}/calculate")
    public ResponseEntity<EtaPrediction> calculateEta(
            @PathVariable Long shipmentId) {

        return ResponseEntity.ok(
                etaPredictionService.calculateEta(shipmentId)
        );
    }
}