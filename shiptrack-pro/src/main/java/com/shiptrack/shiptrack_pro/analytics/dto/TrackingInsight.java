package com.shiptrack.shiptrack_pro.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrackingInsight {

    private Long shipmentId;

    private String trackingNumber;

    private String currentStatus;

    private String latestLocation;

    private LocalDateTime latestEventTime;

    private long trackingEventCount;
}