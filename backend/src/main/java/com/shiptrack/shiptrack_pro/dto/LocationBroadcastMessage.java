package com.shiptrack.shiptrack_pro.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * The payload broadcast over STOMP to /topic/shipment/{shipmentId}/location whenever a
 * driver posts a new position. Jackson serializes this automatically (spring-boot-starter-web
 * already registers MappingJackson2MessageConverter as the default STOMP message converter).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LocationBroadcastMessage {
    private Long shipmentId;
    private Long routeId;
    private Long driverId;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private LocalDateTime timestamp;
}
