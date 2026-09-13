package com.shiptrack.shiptrack_pro.service;

import com.shiptrack.shiptrack_pro.dto.EtaPredictionResponse;

public interface EtaPredictionService {
    /** (Re)calculates and stores the ETA prediction for a shipment based on its priority and history. */
    EtaPredictionResponse calculateForShipment(Long shipmentId);
    EtaPredictionResponse getForShipment(Long shipmentId);
}
