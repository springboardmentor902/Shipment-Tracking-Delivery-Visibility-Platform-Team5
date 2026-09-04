package com.shiptrack.shiptrack_pro.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerAnalyticsResponse {

    private long totalShipments;

    private long activeShipments;

    private long deliveredShipments;

    private long pendingShipments;

    private double averageDeliveryTimeDays;

    private Map<String, Long> statusBreakdown;

    private List<ShipmentSummary> shipmentHistory;

    private List<TrackingInsight> trackingInsights;
}