package com.shiptrack.shiptrack_pro.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class ShipmentCreateRequest {

    private Long businessId;

    @NotBlank(message = "Sender name is required")
    private String senderName;
    private String senderPhone;
    @NotBlank(message = "Sender address is required")
    private String senderAddress;

    @NotBlank(message = "Receiver name is required")
    private String receiverName;
    private String receiverPhone;
    private String receiverEmail;
    @NotBlank(message = "Receiver address is required")
    private String receiverAddress;

    @NotBlank(message = "Pickup address is required")
    private String pickupAddress;
    @NotBlank(message = "Delivery address is required")
    private String deliveryAddress;

    /** STANDARD or EXPRESS. Defaults to STANDARD if omitted. */
    private String priority;

    @NotEmpty(message = "At least one package is required")
    @Valid
    private List<PackageRequest> packages;
}
