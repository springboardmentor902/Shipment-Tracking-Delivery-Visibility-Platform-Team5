package com.shiptrack.shiptrack_pro.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemMonitoring {

    private String backendStatus;

    private String mapsStatus;

    private String notificationStatus;

    private String websocketStatus;

    private long notificationsSent;

    private long notificationsFailed;

    private double notificationSuccessRate;
}