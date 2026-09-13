package com.shiptrack.shiptrack_pro.service;

import com.shiptrack.shiptrack_pro.dto.ProofOfDeliveryRequest;
import com.shiptrack.shiptrack_pro.dto.ProofOfDeliveryResponse;

import java.util.List;

public interface ProofOfDeliveryService {
    ProofOfDeliveryResponse submitPod(Long shipmentId, Long submittedByUserId, ProofOfDeliveryRequest request);
    ProofOfDeliveryResponse verifyPod(Long shipmentId, Long verifiedByUserId, boolean approved);

    /**
     * Staff roles (LOGISTICS_OPERATOR/SUPPORT_AGENT/ADMINISTRATOR) can view any shipment's
     * proof. CUSTOMER/BUSINESS_CLIENT can only view proof for shipments they own - throws
     * 403 otherwise.
     */
    ProofOfDeliveryResponse getForShipment(Long shipmentId, Long requestingUserId, String requestingUserRole);

    /** The verification queue - every PENDING proof, oldest first. Admin/Support Agent only. */
    List<ProofOfDeliveryResponse> getPendingVerification();
}
