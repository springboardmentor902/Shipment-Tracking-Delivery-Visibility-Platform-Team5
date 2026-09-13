package com.shiptrack.shiptrack_pro.service;

import com.shiptrack.shiptrack_pro.dto.*;
import com.shiptrack.shiptrack_pro.entity.Shipment;

import java.util.List;

public interface ShipmentService {
    ShipmentResponse createShipment(String creatorEmail, ShipmentCreateRequest request);
    ShipmentResponse getById(Long id);
    ShipmentResponse getByTrackingNumber(String trackingNumber);
    List<ShipmentResponse> getAll();
    List<ShipmentResponse> getForCurrentUser(String email);
    ShipmentResponse updateShipment(Long id, ShipmentUpdateRequest request);

    /**
     * ADMINISTRATOR and LOGISTICS_OPERATOR can update any shipment's status.
     * BUSINESS_CLIENT can only update shipments belonging to their own business - throws
     * 403 otherwise.
     */
    ShipmentResponse updateStatus(Long id, String newStatus, Long updatedByUserId, String requesterRole);

    ShipmentResponse cancelShipment(Long id, ShipmentCancelRequest request);
    ShipmentResponse assignOperator(Long id, Long operatorId);

    /**
     * The same "which shipments can this user see" resolution getForCurrentUser uses
     * internally, exposed as entities rather than DTOs so other modules (the Reports &
     * Export module in particular) can reuse the exact same scoping logic instead of
     * duplicating it: LOGISTICS_OPERATOR sees shipments assigned to them, ADMINISTRATOR
     * sees everything, BUSINESS_CLIENT sees shipments belonging to their own
     * BusinessAccount (by business_id, not just what they personally created), everyone
     * else (CUSTOMER, etc.) sees only what they created.
     */
    List<Shipment> resolveAccessibleShipments(Long userId, String role);
}
