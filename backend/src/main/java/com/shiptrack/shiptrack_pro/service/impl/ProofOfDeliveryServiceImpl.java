package com.shiptrack.shiptrack_pro.service.impl;

import com.shiptrack.shiptrack_pro.dto.ProofOfDeliveryRequest;
import com.shiptrack.shiptrack_pro.dto.ProofOfDeliveryResponse;
import com.shiptrack.shiptrack_pro.entity.BusinessAccount;
import com.shiptrack.shiptrack_pro.entity.ProofOfDelivery;
import com.shiptrack.shiptrack_pro.entity.Shipment;
import com.shiptrack.shiptrack_pro.entity.TrackingEvent;
import com.shiptrack.shiptrack_pro.repository.BusinessAccountRepository;
import com.shiptrack.shiptrack_pro.repository.ProofOfDeliveryRepository;
import com.shiptrack.shiptrack_pro.repository.ShipmentRepository;
import com.shiptrack.shiptrack_pro.repository.TrackingEventRepository;
import com.shiptrack.shiptrack_pro.service.NotificationService;
import com.shiptrack.shiptrack_pro.service.NotificationType;
import com.shiptrack.shiptrack_pro.service.ProofOfDeliveryService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

/**
 * Proof of Delivery Module (Milestone 3). A Logistics Operator submits POD evidence
 * (signature/photo/recipient name) which - on successful submission - immediately marks
 * the shipment DELIVERED and stamps actual_delivery_date. An Administrator or Support
 * Agent separately verifies the submitted proof afterward (an audit/QA step; it records
 * verification_status and verified_by but does not itself change the shipment's status,
 * since the shipment is already DELIVERED by the time verification happens).
 */
@Service
@RequiredArgsConstructor
public class ProofOfDeliveryServiceImpl implements ProofOfDeliveryService {

    private static final Logger log = LoggerFactory.getLogger(ProofOfDeliveryServiceImpl.class);

    private static final Set<String> STAFF_ROLES = Set.of("LOGISTICS_OPERATOR", "SUPPORT_AGENT", "ADMINISTRATOR");

    private final ProofOfDeliveryRepository podRepository;
    private final ShipmentRepository shipmentRepository;
    private final TrackingEventRepository trackingEventRepository;
    private final BusinessAccountRepository businessAccountRepository;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public ProofOfDeliveryResponse submitPod(Long shipmentId, Long submittedByUserId, ProofOfDeliveryRequest request) {
        Shipment shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Shipment not found"));

        if ("CANCELLED".equals(shipment.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Cannot submit proof of delivery for a cancelled shipment.");
        }
        if (podRepository.existsByShipmentId(shipmentId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Proof of delivery already submitted for this shipment.");
        }

        LocalDateTime now = LocalDateTime.now();

        ProofOfDelivery pod = ProofOfDelivery.builder()
                .shipmentId(shipmentId)
                .signatureUrl(request.getSignatureUrl())
                .photoUrl(request.getPhotoUrl())
                .deliveredToName(request.getDeliveredToName())
                .deliveryNotes(request.getDeliveryNotes())
                .verificationStatus("PENDING")
                .deliveredAt(now)
                .build();

        ProofOfDelivery saved = podRepository.save(pod);

        // Submission itself completes the delivery - status flips immediately, not on
        // verification, which is a separate downstream QA step.
        shipment.setStatus("DELIVERED");
        shipment.setActualDeliveryDate(LocalDate.now());
        shipmentRepository.save(shipment);

        trackingEventRepository.save(TrackingEvent.builder()
                .shipmentId(shipmentId)
                .updatedBy(submittedByUserId)
                .status("DELIVERED")
                .notes("Proof of delivery submitted - delivered to " + request.getDeliveredToName())
                .eventTimestamp(now)
                .build());

        try {
            notificationService.send(NotificationType.DELIVERY_CONFIRMATION, shipment.getCreatedBy(), shipmentId);
        } catch (Exception e) {
            log.warn("Delivery-confirmation notification failed for shipment {}: {}", shipmentId, e.getMessage());
        }

        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public ProofOfDeliveryResponse verifyPod(Long shipmentId, Long verifiedByUserId, boolean approved) {
        ProofOfDelivery pod = podRepository.findByShipmentId(shipmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "No proof of delivery submitted yet for this shipment."));

        pod.setVerifiedBy(verifiedByUserId);
        pod.setVerificationStatus(approved ? "VERIFIED" : "DISPUTED");
        ProofOfDelivery saved = podRepository.save(pod);

        // Shipment is already DELIVERED from submission - verification is an audit step on
        // top of that, it doesn't change the shipment's status either way (including on
        // dispute; disputes are a signal for staff to follow up, not an automatic revert).

        return mapToResponse(saved);
    }

    @Override
    public ProofOfDeliveryResponse getForShipment(Long shipmentId, Long requestingUserId, String requestingUserRole) {
        Shipment shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Shipment not found"));

        if (!STAFF_ROLES.contains(requestingUserRole)) {
            boolean isOwner = requestingUserId.equals(shipment.getCreatedBy());
            boolean isOwningBusiness = shipment.getBusinessId() != null
                    && businessAccountRepository.findByUserId(requestingUserId)
                            .map(BusinessAccount::getId)
                            .map(businessAccountId -> businessAccountId.equals(shipment.getBusinessId()))
                            .orElse(false);

            if (!isOwner && !isOwningBusiness) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "You do not have access to this shipment's proof of delivery.");
            }
        }

        ProofOfDelivery pod = podRepository.findByShipmentId(shipmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "No proof of delivery found for this shipment."));
        return mapToResponse(pod);
    }

    @Override
    public List<ProofOfDeliveryResponse> getPendingVerification() {
        return podRepository.findByVerificationStatusOrderByDeliveredAtAsc("PENDING")
                .stream().map(this::mapToResponse).toList();
    }

    private ProofOfDeliveryResponse mapToResponse(ProofOfDelivery p) {
        String trackingNumber = shipmentRepository.findById(p.getShipmentId())
                .map(Shipment::getTrackingNumber)
                .orElse(null);

        return ProofOfDeliveryResponse.builder()
                .id(p.getId())
                .shipmentId(p.getShipmentId())
                .trackingNumber(trackingNumber)
                .verifiedBy(p.getVerifiedBy())
                .signatureUrl(p.getSignatureUrl())
                .photoUrl(p.getPhotoUrl())
                .deliveredToName(p.getDeliveredToName())
                .deliveryNotes(p.getDeliveryNotes())
                .verificationStatus(p.getVerificationStatus())
                .deliveredAt(p.getDeliveredAt())
                .build();
    }
}
