package com.shiptrack.shiptrack_pro.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class PackageRequest {
    private String description;
    private BigDecimal weightKg;
    private BigDecimal lengthCm;
    private BigDecimal widthCm;
    private BigDecimal heightCm;
    private Integer quantity;
    private BigDecimal declaredValue;
    private Boolean fragile;
}
