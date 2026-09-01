package com.shiptrack.shiptrack_pro.service.impl;

import com.shiptrack.shiptrack_pro.entity.ProofOfDelivery;
import com.shiptrack.shiptrack_pro.entity.Shipment;
import com.shiptrack.shiptrack_pro.entity.ShipmentStatus;
import com.shiptrack.shiptrack_pro.entity.User;
import com.shiptrack.shiptrack_pro.repository.ProofOfDeliveryRepository;
import com.shiptrack.shiptrack_pro.repository.ShipmentRepository;
import com.shiptrack.shiptrack_pro.repository.UserRepository;
import com.shiptrack.shiptrack_pro.service.FileStorageService;
import com.shiptrack.shiptrack_pro.service.ProofOfDeliveryService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProofOfDeliveryServiceImpl
        implements ProofOfDeliveryService {

    private final ProofOfDeliveryRepository podRepository;

    private final ShipmentRepository shipmentRepository;

    private final UserRepository userRepository;

    private final FileStorageService fileStorageService;


    // =========================================================
    // SUBMIT PROOF OF DELIVERY
    // =========================================================

    @Override
    @Transactional
    public ProofOfDelivery submitProof(
            Long shipmentId,
            String deliveredToName,
            String deliveryNotes,
            MultipartFile signature,
            MultipartFile photo,
            String email) {

        User operator = getUser(email);

        // Only logistics operator can submit POD
        if (!hasRole(
                operator,
                "LOGISTICS_OPERATOR")) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Only logistics operators can submit proof of delivery"
            );
        }

        Shipment shipment =
                shipmentRepository
                        .findById(shipmentId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Shipment not found with id: "
                                                + shipmentId
                                )
                        );


        // =====================================================
        // CHECK ASSIGNED OPERATOR
        // =====================================================

        if (shipment.getAssignedOperatorId() != null
                && !shipment
                        .getAssignedOperatorId()
                        .equals(operator.getId())) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "This shipment is not assigned to you"
            );
        }


        // =====================================================
        // RECIPIENT VALIDATION
        // =====================================================

        if (deliveredToName == null
                || deliveredToName.trim().isEmpty()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Delivered recipient name is required"
            );
        }


        // =====================================================
        // SIGNATURE VALIDATION
        // =====================================================

        if (signature == null
                || signature.isEmpty()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Signature file is required"
            );
        }


        // =====================================================
        // PHOTO VALIDATION
        // =====================================================

        if (photo == null
                || photo.isEmpty()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Delivery photo is required"
            );
        }


        // =====================================================
        // DUPLICATE POD CHECK
        // =====================================================

        if (podRepository
                .existsByShipmentId(shipmentId)) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Proof of delivery already exists for shipment "
                            + shipmentId
            );
        }


        // =====================================================
        // STORE SIGNATURE
        // =====================================================

        String signatureUrl =
                fileStorageService.store(
                        signature,
                        "pod/signatures"
                );


        // =====================================================
        // STORE DELIVERY PHOTO
        // =====================================================

        String photoUrl =
                fileStorageService.store(
                        photo,
                        "pod/photos"
                );


        // =====================================================
        // CREATE POD
        // =====================================================

        ProofOfDelivery pod =
                ProofOfDelivery.builder()
                        .shipmentId(shipmentId)
                        .deliveredToName(
                                deliveredToName.trim()
                        )
                        .deliveryNotes(
                                deliveryNotes
                        )
                        .signatureUrl(
                                signatureUrl
                        )
                        .photoUrl(
                                photoUrl
                        )
                        .verificationStatus(
                                "PENDING"
                        )
                        .deliveredAt(
                                LocalDateTime.now()
                        )
                        .build();


        ProofOfDelivery savedPod =
                podRepository.save(pod);


        // =====================================================
        // UPDATE SHIPMENT
        // =====================================================

        shipment.setStatus(
                ShipmentStatus.DELIVERED
        );

        shipment.setActualDeliveryDate(
                LocalDate.now()
        );

        shipmentRepository.save(shipment);


        return savedPod;
    }


    // =========================================================
    // APPROVE / VERIFY POD
    // =========================================================

    @Override
    @Transactional
    public ProofOfDelivery verifyProof(
            Long shipmentId,
            String email) {

        User verifier = getUser(email);

        checkVerifierRole(verifier);


        ProofOfDelivery pod =
                getPodForVerification(shipmentId);


        if ("VERIFIED".equalsIgnoreCase(
                pod.getVerificationStatus())) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Proof of delivery is already verified"
            );
        }


        pod.setVerificationStatus(
                "VERIFIED"
        );

        pod.setVerifiedBy(
                verifier.getId()
        );


        if (pod.getDeliveredAt() == null) {

            pod.setDeliveredAt(
                    LocalDateTime.now()
            );
        }


        return podRepository.save(pod);
    }


    // =========================================================
    // REJECT POD
    // =========================================================

    @Override
    @Transactional
    public ProofOfDelivery rejectProof(
            Long shipmentId,
            String email) {

        User verifier = getUser(email);

        checkVerifierRole(verifier);


        ProofOfDelivery pod =
                getPodForVerification(shipmentId);


        if ("VERIFIED".equalsIgnoreCase(
                pod.getVerificationStatus())) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Verified proof of delivery cannot be rejected"
            );
        }


        pod.setVerificationStatus(
                "REJECTED"
        );

        pod.setVerifiedBy(
                verifier.getId()
        );


        return podRepository.save(pod);
    }


    // =========================================================
    // GET POD
    // =========================================================

    @Override
    public ProofOfDelivery getProof(
            Long shipmentId,
            String email) {

        User user = getUser(email);

        Shipment shipment =
                shipmentRepository
                        .findById(shipmentId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Shipment not found"
                                )
                        );


        boolean authorized = false;


        // ADMIN
        if (hasRole(
                user,
                "ADMINISTRATOR")) {

            authorized = true;
        }


        // SUPPORT AGENT
        if (hasRole(
                user,
                "SUPPORT_AGENT")) {

            authorized = true;
        }


        // CUSTOMER
        if (hasRole(
                user,
                "CUSTOMER")
                && shipment.getCreatedBy() != null
                && shipment
                        .getCreatedBy()
                        .equals(user.getId())) {

            authorized = true;
        }


        // BUSINESS CLIENT
        if (hasRole(
                user,
                "BUSINESS_CLIENT")
                && shipment.getBusinessId() != null
                && shipment
                        .getBusinessId()
                        .equals(user.getId())) {

            authorized = true;
        }


        // LOGISTICS OPERATOR
        if (hasRole(
                user,
                "LOGISTICS_OPERATOR")
                && shipment.getAssignedOperatorId() != null
                && shipment
                        .getAssignedOperatorId()
                        .equals(user.getId())) {

            authorized = true;
        }


        if (!authorized) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You cannot view this proof of delivery"
            );
        }


        return podRepository
                .findByShipmentId(shipmentId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Proof of delivery not found for shipment: "
                                        + shipmentId
                        )
                );
    }


    // =========================================================
    // PENDING VERIFICATION QUEUE
    // =========================================================

    @Override
    public List<ProofOfDelivery> getPendingProofs(
            String email) {

        User user = getUser(email);

        checkVerifierRole(user);


        return podRepository
                .findByVerificationStatusIgnoreCase(
                        "PENDING"
                );
    }


    // =========================================================
    // COMMON METHODS
    // =========================================================

    private ProofOfDelivery getPodForVerification(
            Long shipmentId) {

        return podRepository
                .findByShipmentId(shipmentId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Proof of delivery not found for shipment: "
                                        + shipmentId
                        )
                );
    }


    private void checkVerifierRole(
            User user) {

        if (!hasRole(
                user,
                "SUPPORT_AGENT")
                && !hasRole(
                        user,
                        "ADMINISTRATOR")) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Only support agents or administrators can verify POD"
            );
        }
    }


    private User getUser(
            String email) {

        return userRepository
                .findByEmail(email)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.UNAUTHORIZED,
                                "User not found"
                        )
                );
    }


    private boolean hasRole(
            User user,
            String role) {

        return user.getRole() != null
                && user.getRole()
                        .equalsIgnoreCase(role);
    }
}