package com.shiptrack.shiptrack_pro.controller;

import com.shiptrack.shiptrack_pro.dto.EtaPredictionResponse;
import com.shiptrack.shiptrack_pro.service.EtaPredictionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/** ETA Prediction Module (PDF 4.6) - delivery time estimation and delay/risk scoring. */
@RestController
@RequestMapping("/api/eta")
@RequiredArgsConstructor
public class EtaPredictionController {

    private final EtaPredictionService etaPredictionService;

    @PostMapping("/{shipmentId}/predict")
    public ResponseEntity<EtaPredictionResponse> predict(@PathVariable Long shipmentId) {
        return ResponseEntity.ok(etaPredictionService.calculateForShipment(shipmentId));
    }

    @GetMapping("/{shipmentId}")
    public ResponseEntity<EtaPredictionResponse> get(@PathVariable Long shipmentId) {
        return ResponseEntity.ok(etaPredictionService.getForShipment(shipmentId));
    }
}
