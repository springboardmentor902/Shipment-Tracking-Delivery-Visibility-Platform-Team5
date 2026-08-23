package com.shiptrack.shiptrack_pro.dto;

import lombok.Data;

@Data
public class TrackingEventRequest {

    private String status;
    private String location;
    private String notes;
}