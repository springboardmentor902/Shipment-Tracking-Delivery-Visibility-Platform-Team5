package com.shiptrack.shiptrack_pro.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * One row per ETA_PREDICTIONS record - the latest delivery-time prediction for a Shipment.
 *
 * delay_risk_score: 0 (no delay risk) to 10 (very high delay risk).
 * confidence_score: 0 to 100, a percentage - how confident the prediction is given the
 * data available (e.g. no Route yet, or no traffic condition, lowers confidence).
 */
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

    @Column(name = "shipment_id", nullable = false, unique = true)
    private Long shipmentId;

    @Column(name = "predicted_delivery_time")
    private LocalDateTime predictedDeliveryTime;

    /**
     * 0.0 - 10.0, higher means a higher chance of delay.
     */
    @Column(name = "delay_risk_score")
    private BigDecimal delayRiskScore;

    /**
     * 0 - 100, a percentage.
     */
    @Column(name = "confidence_score")
    private BigDecimal confidenceScore;

    /**
     * Stores prediction factors as normal PostgreSQL TEXT.
     *
     * @Lob is intentionally not used because it can cause
     * "Unable to access lob stream" errors with PostgreSQL/Hibernate.
     */
    @Column(name = "factors", columnDefinition = "TEXT")
    private String factors;

    @Column(name = "calculated_at")
    private LocalDateTime calculatedAt;
}