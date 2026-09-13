package com.shiptrack.shiptrack_pro.service;

import com.shiptrack.shiptrack_pro.dto.TrackingEventRequest;
import com.shiptrack.shiptrack_pro.dto.TrackingEventResponse;

import java.util.List;

public interface TrackingEventService {
    TrackingEventResponse addEvent(Long shipmentId, Long updatedByUserId, TrackingEventRequest request);
    List<TrackingEventResponse> getTimeline(Long shipmentId);
    TrackingEventResponse getLatest(Long shipmentId);
}
