package com.shiptrack.shiptrack_pro.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShipmentSummary {

    private Long shipmentId;

    private String trackingNumber;

    private String status;

    private String priority;

    private String pickupAddress;

    private String deliveryAddress;

    private LocalDate estimatedDeliveryDate;

    private LocalDate actualDeliveryDate;
}