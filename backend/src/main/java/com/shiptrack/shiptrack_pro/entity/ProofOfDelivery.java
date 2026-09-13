package com.shiptrack.shiptrack_pro.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/** One row per PROOF_OF_DELIVERY record - the delivery confirmation evidence for a Shipment. */
@Entity
@Table(name = "proof_of_delivery")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProofOfDelivery {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "shipment_id", nullable = false, unique = true)
    private Long shipmentId;

    @Column(name = "verified_by")
    private Long verifiedBy;

    @Column(name = "signature_url")
    private String signatureUrl;

    @Column(name = "photo_url")
    private String photoUrl;

    @Column(name = "delivered_to_name")
    private String deliveredToName;

    @Column(name = "delivery_notes")
    private String deliveryNotes;

    /** PENDING, VERIFIED, DISPUTED */
    @Column(name = "verification_status")
    private String verificationStatus;

    @Column(name = "delivered_at")
    private LocalDateTime deliveredAt;
}
