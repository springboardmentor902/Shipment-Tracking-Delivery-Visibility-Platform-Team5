package com.shiptrack.shiptrack_pro.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemMonitoringSummary {
    private long pendingPodVerifications;
    private long atRiskShipmentCount;
}
