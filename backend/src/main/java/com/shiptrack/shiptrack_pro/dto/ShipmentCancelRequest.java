package com.shiptrack.shiptrack_pro.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ShipmentCancelRequest {
    @NotBlank(message = "Cancellation reason is required")
    private String cancellationReason;
}
