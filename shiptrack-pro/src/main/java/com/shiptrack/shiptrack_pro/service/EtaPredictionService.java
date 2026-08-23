package com.shiptrack.shiptrack_pro.service;

import com.shiptrack.shiptrack_pro.entity.EtaPrediction;

public interface EtaPredictionService {

    EtaPrediction getEtaPrediction(Long shipmentId);

    EtaPrediction calculateEta(Long shipmentId);
}