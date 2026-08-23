package com.shiptrack.shiptrack_pro.dto;

import lombok.Data;

@Data
public class ProfileUpdateRequest {

    private String fullName;
    private String phone;
    private String profileImageUrl;
}