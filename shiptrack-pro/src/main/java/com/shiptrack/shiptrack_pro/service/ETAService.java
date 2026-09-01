package com.shiptrack.shiptrack_pro.service;

import com.shiptrack.shiptrack_pro.entity.ETAPrediction;

public interface ETAService {

    ETAPrediction calculateAndSave(Long shipmentId);

    ETAPrediction getPrediction(Long shipmentId);
}