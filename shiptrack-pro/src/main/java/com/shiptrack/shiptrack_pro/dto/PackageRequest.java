package com.shiptrack.shiptrack_pro.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class PackageRequest {

    private BigDecimal weight;
    private String dimensions;
    private Integer quantity;
    private BigDecimal declaredValue;
    private Boolean fragile;
    private String description;
}