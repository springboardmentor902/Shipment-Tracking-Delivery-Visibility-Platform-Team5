package com.shiptrack.shiptrack_pro.service;

import com.shiptrack.shiptrack_pro.dto.TrackingEventRequest;
import com.shiptrack.shiptrack_pro.entity.TrackingEvent;

import java.util.List;

public interface TrackingEventService {

    TrackingEvent addEvent(Long shipmentId, TrackingEventRequest request);

    List<TrackingEvent> getHistory(Long shipmentId);
}