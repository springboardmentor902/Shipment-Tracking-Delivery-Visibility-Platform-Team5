package com.shiptrack.shiptrack_pro.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** One row per ROUTES record - the planned/actual delivery route for a Shipment. */
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

    @Lob
    private String waypoints;

    @Column(name = "distance_km")
    private BigDecimal distanceKm;

    @Column(name = "estimated_time_minutes")
    private Integer estimatedTimeMinutes;

    @Column(name = "actual_time_minutes")
    private Integer actualTimeMinutes;

    @Column(name = "traffic_condition")
    private String trafficCondition;

    // --- Live Delivery Monitoring (last known driver position) ---
    // Not present in the original ER diagram; added so a route can hold the driver's most
    // recent broadcast position. With ddl-auto=update these columns are added automatically.
    @Column(name = "last_known_latitude")
    private BigDecimal lastKnownLatitude;

    @Column(name = "last_known_longitude")
    private BigDecimal lastKnownLongitude;

    @Column(name = "last_location_updated_at")
    private LocalDateTime lastLocationUpdatedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    /**
     * Route Management: whether this is the active route for its shipment. Exactly one
     * route per shipment should have isCurrent=true at a time - RouteServiceImpl enforces
     * this by flipping the previous current route to false in the same transaction that
     * creates a new one (a re-route).
     */
    @Column(name = "is_current")
    @Builder.Default
    private Boolean isCurrent = true;

    /** Why RouteOptimizationService picked this route among Google's alternatives, if it ran. */
    @Column(name = "selection_reason")
    private String selectionReason;
}
