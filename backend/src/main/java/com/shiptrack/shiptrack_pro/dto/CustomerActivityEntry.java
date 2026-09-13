package com.shiptrack.shiptrack_pro.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerActivityEntry {
    private String receiverName;
    private String receiverEmail;
    private long shipmentCount;
}
