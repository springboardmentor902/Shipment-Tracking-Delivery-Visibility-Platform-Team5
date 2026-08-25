package com.shiptrack.shiptrack_pro.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "tracking_events")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrackingEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "shipment_id", nullable = false)
    private Long shipmentId;

    @Column(name = "updated_by")
    private Long updatedBy;

    private String status;

    private String location;

    private BigDecimal latitude;

    private BigDecimal longitude;

    private String notes;

    @Column(name = "event_timestamp")
    private LocalDateTime eventTimestamp;
}