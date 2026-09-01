package com.shiptrack.shiptrack_pro.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "routes")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Route {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "shipment_id", nullable = false)
    private Long shipmentId;

    @Column(name = "driver_id")
    private Long driverId;

    private String origin;

    private String destination;

    @Column(columnDefinition = "text")
    private String waypoints;

    @Column(name = "distance_km")
    private BigDecimal distanceKm;

    @Column(name = "estimated_time_minutes")
    private Integer estimatedTimeMinutes;

    @Column(name = "actual_time_minutes")
    private Integer actualTimeMinutes;

    @Column(name = "traffic_condition")
    private String trafficCondition;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "last_latitude", precision = 10, scale = 7)
    private BigDecimal lastLatitude;

    @Column(name = "last_longitude", precision = 10, scale = 7)
    private BigDecimal lastLongitude;

    @Column(name = "last_location")
    private String lastLocation;

    @Column(name = "last_location_at")
    private LocalDateTime lastLocationAt;
}