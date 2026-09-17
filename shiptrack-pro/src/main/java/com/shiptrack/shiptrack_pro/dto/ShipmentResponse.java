package com.shiptrack.shiptrack_pro.dto;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShipmentResponse {

    private Long id;

    private String trackingNumber;

    private String senderName;
    private String senderPhone;
    private String senderAddress;

    private String receiverName;
    private String receiverPhone;
    private String receiverEmail;
    private String receiverAddress;

    private String pickupAddress;
    private String deliveryAddress;

    private String status;
    private String priority;

    private LocalDate estimatedDeliveryDate;
    private LocalDate actualDeliveryDate;

    private String cancellationReason;

    private List<PackageResponse> packages;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}