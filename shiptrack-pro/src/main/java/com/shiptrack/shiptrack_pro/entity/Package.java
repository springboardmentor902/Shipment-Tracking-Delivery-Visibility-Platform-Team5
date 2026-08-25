package com.shiptrack.shiptrack_pro.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "packages")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Package {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "shipment_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Shipment shipment;

    private BigDecimal weight;

    private String dimensions;

    private Integer quantity;

    private BigDecimal declaredValue;

    private Boolean fragile;

    @Column(length = 1000)
    private String description;
}