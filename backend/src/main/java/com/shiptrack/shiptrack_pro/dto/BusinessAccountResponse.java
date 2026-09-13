package com.shiptrack.shiptrack_pro.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BusinessAccountResponse {
    private Long id;
    private Long userId;
    private String companyName;
    private String gstNumber;
    private String businessAddress;
    private String industryType;
    private LocalDateTime createdAt;
}
