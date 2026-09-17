package com.shiptrack.shiptrack_pro.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RouteRequest {

    private Long shipmentId;

    private String sourceAddress;

    private String destinationAddress;

    private Long driverId;
}