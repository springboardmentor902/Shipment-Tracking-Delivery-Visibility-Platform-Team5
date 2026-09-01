package com.shiptrack.shiptrack_pro.service.impl;

import com.shiptrack.shiptrack_pro.dto.LiveLocationUpdate;
import com.shiptrack.shiptrack_pro.dto.RouteLocationRequest;
import com.shiptrack.shiptrack_pro.entity.Route;
import com.shiptrack.shiptrack_pro.entity.TrackingEvent;
import com.shiptrack.shiptrack_pro.repository.RouteRepository;
import com.shiptrack.shiptrack_pro.repository.TrackingEventRepository;
import com.shiptrack.shiptrack_pro.service.LiveTrackingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class LiveTrackingServiceImpl implements LiveTrackingService {

    private final RouteRepository routeRepository;
    private final TrackingEventRepository trackingEventRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    @Transactional
    public LiveLocationUpdate updateLocation(
            Long routeId,
            RouteLocationRequest request) {

        Route route = routeRepository.findById(routeId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Route not found with id: " + routeId
                ));

        LocalDateTime now = LocalDateTime.now();

        route.setLastLatitude(request.getLatitude());
        route.setLastLongitude(request.getLongitude());
        route.setLastLocation(request.getLocation());
        route.setLastLocationAt(now);

        routeRepository.save(route);

        TrackingEvent event = TrackingEvent.builder()
                .shipmentId(route.getShipmentId())
                .updatedBy(route.getDriverId())
                .status("LOCATION_UPDATED")
                .location(request.getLocation())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .eventTimestamp(now)
                .build();

        trackingEventRepository.save(event);

        LiveLocationUpdate update = LiveLocationUpdate.builder()
                .routeId(route.getId())
                .shipmentId(route.getShipmentId())
                .driverId(route.getDriverId())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .location(request.getLocation())
                .updatedAt(now)
                .build();

        messagingTemplate.convertAndSend(
                "/topic/shipments/" + route.getShipmentId(),
                update
        );

        return update;
    }
}