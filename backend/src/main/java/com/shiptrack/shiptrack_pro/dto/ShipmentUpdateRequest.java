package com.shiptrack.shiptrack_pro.dto;

import lombok.Data;

@Data
public class ShipmentUpdateRequest {
    private String senderName;
    private String senderPhone;
    private String senderAddress;
    private String receiverName;
    private String receiverPhone;
    private String receiverEmail;
    private String receiverAddress;
    private String pickupAddress;
    private String deliveryAddress;
    private String priority;
    private Long assignedOperatorId;
}
