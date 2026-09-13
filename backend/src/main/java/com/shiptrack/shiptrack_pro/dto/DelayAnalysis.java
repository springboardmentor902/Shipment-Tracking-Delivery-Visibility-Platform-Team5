package com.shiptrack.shiptrack_pro.dto;

import lombok.*;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DelayAnalysis {
    private long atRiskShipmentCount;
    private Double avgDelayRiskScore;
    private long delayedDeliveryCount;
    /** The individual at-risk shipments themselves (not just the count), sorted highest-risk first. */
    private List<AtRiskShipmentEntry> atRiskShipments;
}
