package com.shiptrack.shiptrack_pro.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class TrackingEventRequest {
    @NotBlank(message = "Status is required")
    private String status;
    private String location;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private String notes;
}
