package com.shiptrack.shiptrack_pro.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ProofOfDeliveryRequest {
    private String signatureUrl;
    private String photoUrl;
    @NotBlank(message = "Delivered-to name is required")
    private String deliveredToName;
    private String deliveryNotes;
}
