package com.shiptrack.shiptrack_pro.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RouteResponse {

    private Long id;

    private Long shipmentId;

    private Long driverId;

    private String sourceAddress;

    private String destinationAddress;

    private Double sourceLatitude;

    private Double sourceLongitude;

    private Double destinationLatitude;

    private Double destinationLongitude;

    private Double distanceKm;

    private Integer estimatedTimeMinutes;

    private String status;
}