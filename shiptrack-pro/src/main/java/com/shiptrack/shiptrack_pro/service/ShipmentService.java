package com.shiptrack.shiptrack_pro.service;

import com.shiptrack.shiptrack_pro.entity.Shipment;

import java.util.List;

public interface ShipmentService {

    Shipment createShipment(
            Shipment shipment,
            String userEmail
    );

    List<Shipment> getShipmentsForUser(
            String userEmail
    );

    Shipment getShipmentByIdForUser(
            Long id,
            String userEmail
    );

    Shipment getShipmentById(Long id);

    Shipment updateShipment(
            Long id,
            Shipment shipment
    );

    Shipment updateStatus(
            Long id,
            String status
    );

    void cancelShipment(Long id);
}