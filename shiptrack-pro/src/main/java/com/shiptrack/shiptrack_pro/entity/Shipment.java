package com.shiptrack.shiptrack_pro.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "shipments")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Shipment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tracking_number", nullable = false, unique = true)
    private String trackingNumber;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "business_id")
    private Long businessId;

    @Column(name = "assigned_operator_id")
    private Long assignedOperatorId;

    @Column(name = "sender_name")
    private String senderName;

    @Column(name = "sender_phone")
    private String senderPhone;

    @Column(name = "sender_address")
    private String senderAddress;

    @Column(name = "receiver_name")
    private String receiverName;

    @Column(name = "receiver_phone")
    private String receiverPhone;

    @Column(name = "receiver_email")
    private String receiverEmail;

    @Column(name = "receiver_address")
    private String receiverAddress;

    @Column(name = "pickup_address")
    private String pickupAddress;

    @Column(name = "delivery_address")
    private String deliveryAddress;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ShipmentStatus status = ShipmentStatus.CREATED;

    @Column(name = "priority")
    private String priority;

    @Column(name = "estimated_delivery_date")
    private LocalDate estimatedDeliveryDate;

    @Column(name = "actual_delivery_date")
    private LocalDate actualDeliveryDate;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @Column(name = "cancellation_reason")
    private String cancellationReason;
}