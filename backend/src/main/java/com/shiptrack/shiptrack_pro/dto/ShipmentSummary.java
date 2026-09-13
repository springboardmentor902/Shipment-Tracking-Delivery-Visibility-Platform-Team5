package com.shiptrack.shiptrack_pro.dto;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/** A lightweight shipment row for history lists/reports - avoids the N+1 package lookups ShipmentResponse does. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShipmentSummary {
    private Long id;
    private String trackingNumber;
    private String status;
    private String priority;
    private String receiverName;
    private LocalDateTime createdAt;
    private LocalDate estimatedDeliveryDate;
    private LocalDate actualDeliveryDate;
}
