package com.shiptrack.shiptrack_pro.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** One row in DelayAnalysis.atRiskShipments - a shipment currently above the delay-risk threshold. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AtRiskShipmentEntry {
    private Long shipmentId;
    private String trackingNumber;
    private String status;
    private BigDecimal delayRiskScore;
    private LocalDateTime predictedDeliveryTime;
}
