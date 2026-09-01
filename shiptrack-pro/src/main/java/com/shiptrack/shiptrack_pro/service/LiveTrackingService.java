package com.shiptrack.shiptrack_pro.service;

import com.shiptrack.shiptrack_pro.dto.LiveLocationUpdate;
import com.shiptrack.shiptrack_pro.dto.RouteLocationRequest;

public interface LiveTrackingService {

    LiveLocationUpdate updateLocation(
            Long routeId,
            RouteLocationRequest request
    );
}