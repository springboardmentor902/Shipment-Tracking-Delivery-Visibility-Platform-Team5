package com.shiptrack.shiptrack_pro.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/** One row per NOTIFICATIONS record - a message sent to a User about a Shipment. */
@Entity
@Table(name = "notifications")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "shipment_id")
    private Long shipmentId;

    private String title;

    private String message;

    /** SHIPMENT_UPDATE, ETA_UPDATE, DELAY_ALERT, DELIVERY_CONFIRMATION */
    private String type;

    /** SENT, DELIVERED, READ, FAILED */
    private String status;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
