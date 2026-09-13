package com.shiptrack.shiptrack_pro.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProofOfDeliveryResponse {
    private Long id;
    private Long shipmentId;
    /** Populated for convenience so the verification queue doesn't need a second lookup per row. */
    private String trackingNumber;
    private Long verifiedBy;
    private String signatureUrl;
    private String photoUrl;
    private String deliveredToName;
    private String deliveryNotes;
    private String verificationStatus;
    private LocalDateTime deliveredAt;
}
