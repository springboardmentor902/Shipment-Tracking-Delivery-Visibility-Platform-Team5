package com.shiptrack.shiptrack_pro.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "routes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Route {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /*
     * One shipment has one route.
     */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shipment_id", nullable = false, unique = true)
    private Shipment shipment;

    /*
     * Driver assigned to this route.
     *
     * We use the existing User table.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_id")
    private User driver;

    /*
     * Starting and destination addresses.
     */
    @Column(nullable = false)
    private String sourceAddress;

    @Column(nullable = false)
    private String destinationAddress;

    /*
     * Google Maps coordinates.
     */
    private Double sourceLatitude;

    private Double sourceLongitude;

    private Double destinationLatitude;

    private Double destinationLongitude;

    /*
     * Google Maps calculated distance.
     *
     * Stored in kilometers.
     */
    private Double distanceKm;

    /*
     * Estimated travel time.
     *
     * Stored in minutes.
     */
    private Integer estimatedTimeMinutes;

    /*
     * Route status.
     */
    @Enumerated(EnumType.STRING)
    private RouteStatus status;

    /*
     * Timestamps.
     */
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {

        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();

        if (status == null) {
            status = RouteStatus.CREATED;
        }
    }

    @PreUpdate
    protected void onUpdate() {

        updatedAt = LocalDateTime.now();
    }
}