package com.shiptrack.shiptrack_pro.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class BusinessAccountRequest {
    @NotBlank(message = "Company name is required")
    private String companyName;
    private String gstNumber;
    private String businessAddress;
    private String industryType;
}
