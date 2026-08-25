package com.shiptrack.shiptrack_pro.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "eta_predictions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EtaPrediction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "shipment_id", nullable = false)
    private Long shipmentId;

    @Column(name = "predicted_delivery_time")
    private LocalDateTime predictedDeliveryTime;

    @Column(name = "delay_risk_score")
    private BigDecimal delayRiskScore;

    @Column(name = "confidence_score")
    private BigDecimal confidenceScore;

    @Column(name = "traffic_factor")
    private BigDecimal trafficFactor;

    @Column(name = "distance_factor")
    private BigDecimal distanceFactor;

    @Column(name = "historical_factor")
    private BigDecimal historicalFactor;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}