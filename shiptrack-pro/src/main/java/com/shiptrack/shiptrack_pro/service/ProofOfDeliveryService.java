package com.shiptrack.shiptrack_pro.service;

import com.shiptrack.shiptrack_pro.entity.ProofOfDelivery;

import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface ProofOfDeliveryService {

    ProofOfDelivery submitProof(
            Long shipmentId,
            String deliveredToName,
            String deliveryNotes,
            MultipartFile signature,
            MultipartFile photo,
            String email
    );

    ProofOfDelivery verifyProof(
            Long shipmentId,
            String email
    );

    ProofOfDelivery rejectProof(
            Long shipmentId,
            String email
    );

    ProofOfDelivery getProof(
            Long shipmentId,
            String email
    );

    List<ProofOfDelivery> getPendingProofs(
            String email
    );
}