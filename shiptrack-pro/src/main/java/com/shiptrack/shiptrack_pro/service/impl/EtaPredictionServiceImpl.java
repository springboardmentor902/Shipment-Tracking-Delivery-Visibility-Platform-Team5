package com.shiptrack.shiptrack_pro.service.impl;

import com.shiptrack.shiptrack_pro.entity.EtaPrediction;
import com.shiptrack.shiptrack_pro.repository.EtaPredictionRepository;
import com.shiptrack.shiptrack_pro.service.EtaPredictionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class EtaPredictionServiceImpl implements EtaPredictionService {

    private final EtaPredictionRepository etaPredictionRepository;

    @Override
    public EtaPrediction getEtaPrediction(Long shipmentId) {

        return etaPredictionRepository.findByShipmentId(shipmentId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "ETA prediction not found for shipment: " + shipmentId
                ));
    }

    @Override
    public EtaPrediction calculateEta(Long shipmentId) {

        // Temporary calculation structure.
        // Google Maps distance/traffic and historical data
        // will be integrated in the next step.

        EtaPrediction prediction = etaPredictionRepository
                .findByShipmentId(shipmentId)
                .orElse(
                        EtaPrediction.builder()
                                .shipmentId(shipmentId)
                                .build()
                );

        prediction.setPredictedDeliveryTime(
                LocalDateTime.now().plusHours(24)
        );

        prediction.setDelayRiskScore(
                BigDecimal.valueOf(0.0)
        );

        prediction.setConfidenceScore(
                BigDecimal.valueOf(0.0)
        );

        prediction.setTrafficFactor(
                BigDecimal.ZERO
        );

        prediction.setDistanceFactor(
                BigDecimal.ZERO
        );

        prediction.setHistoricalFactor(
                BigDecimal.ZERO
        );

        return etaPredictionRepository.save(prediction);
    }
}