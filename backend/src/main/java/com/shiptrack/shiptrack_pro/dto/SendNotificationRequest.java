package com.shiptrack.shiptrack_pro.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/** Body of POST /api/notification - lets staff manually trigger a notification. */
@Data
public class SendNotificationRequest {

    @NotNull(message = "userId is required")
    private Long userId;

    @NotNull(message = "shipmentId is required")
    private Long shipmentId;

    /** Must match one of the NotificationType enum values (e.g. SHIPMENT_UPDATE, DELAY_WARNING). */
    @NotBlank(message = "type is required")
    private String type;
}
