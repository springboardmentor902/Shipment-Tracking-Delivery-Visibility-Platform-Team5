package com.shiptrack.shiptrack_pro.dto;

import lombok.*;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardAnalyticsResponse {
    private long totalShipments;
    private Map<String, Long> shipmentsByStatus;
    private long deliveredOnTime;
    private long deliveredLate;
    private double onTimeDeliveryRate;
    private long activeShipments;
    private long cancelledShipments;
}
