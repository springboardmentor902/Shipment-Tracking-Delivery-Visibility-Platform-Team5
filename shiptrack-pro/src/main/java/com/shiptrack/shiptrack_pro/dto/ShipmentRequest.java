package com.shiptrack.shiptrack_pro.dto;

import java.util.List;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShipmentRequest {

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

    private List<PackageRequest> packages;
}