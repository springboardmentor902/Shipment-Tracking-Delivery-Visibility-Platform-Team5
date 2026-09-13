package com.shiptrack.shiptrack_pro.dto;

import lombok.*;

import java.util.List;
import java.util.Map;

/** GET /api/analytics/customer - scoped to the logged-in customer's own shipments only. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerAnalyticsResponse {
    private long activeShipmentCount;
    private long totalShipments;
    private Map<String, Long> shipmentsByStatus;
    /** Most recent shipments, newest first. */
    private List<ShipmentSummary> shipmentHistory;
    /** Tracking insights. */
    private Double avgTransitHours;
    private Map<String, Long> shipmentsByPriority;
}
