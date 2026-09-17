package com.shiptrack.shiptrack_pro.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PackageResponse {

    private Long id;

    private String packageDescription;

    private Double weight;

    private String dimensions;

    private Integer quantity;

    private BigDecimal declaredValue;

    private Boolean fragile;
}