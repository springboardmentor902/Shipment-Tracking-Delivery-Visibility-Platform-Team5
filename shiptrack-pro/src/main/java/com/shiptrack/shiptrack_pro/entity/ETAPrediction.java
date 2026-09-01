package com.shiptrack.shiptrack_pro.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "eta_predictions",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = "shipment_id")
        }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ETAPrediction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "shipment_id", nullable = false, unique = true)
    private Long shipmentId;

    @Column(name = "predicted_delivery_time")
    private LocalDateTime predictedDeliveryTime;

    @Column(name = "delay_risk_score")
    private Integer delayRiskScore;

    @Column(name = "confidence_score")
    private BigDecimal confidenceScore;

    @Column(columnDefinition = "text")
    private String factors;

    @Column(name = "calculated_at")
    private LocalDateTime calculatedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}