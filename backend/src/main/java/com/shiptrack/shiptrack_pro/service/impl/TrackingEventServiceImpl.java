package com.shiptrack.shiptrack_pro.service.impl;

import com.shiptrack.shiptrack_pro.dto.TrackingEventRequest;
import com.shiptrack.shiptrack_pro.dto.TrackingEventResponse;
import com.shiptrack.shiptrack_pro.entity.Shipment;
import com.shiptrack.shiptrack_pro.entity.TrackingEvent;
import com.shiptrack.shiptrack_pro.repository.ShipmentRepository;
import com.shiptrack.shiptrack_pro.repository.TrackingEventRepository;
import com.shiptrack.shiptrack_pro.service.EtaPredictionService;
import com.shiptrack.shiptrack_pro.service.NotificationService;
import com.shiptrack.shiptrack_pro.service.NotificationType;
import com.shiptrack.shiptrack_pro.service.TrackingEventService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

/** Shipment Tracking Module (PDF 4.4) - live location + status updates and the tracking timeline. */
@Service
@RequiredArgsConstructor
public class TrackingEventServiceImpl implements TrackingEventService {

    private static final Logger log = LoggerFactory.getLogger(TrackingEventServiceImpl.class);

    private final TrackingEventRepository trackingEventRepository;
    private final ShipmentRepository shipmentRepository;
    private final NotificationService notificationService;
    private final EtaPredictionService etaPredictionService;

    @Override
    @Transactional
    public TrackingEventResponse addEvent(Long shipmentId, Long updatedByUserId, TrackingEventRequest request) {
        Shipment shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Shipment not found"));

        TrackingEvent event = TrackingEvent.builder()
                .shipmentId(shipmentId)
                .updatedBy(updatedByUserId)
                .status(request.getStatus().toUpperCase())
                .location(request.getLocation())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .notes(request.getNotes())
                .eventTimestamp(LocalDateTime.now())
                .build();

        TrackingEvent saved = trackingEventRepository.save(event);

        shipment.setStatus(event.getStatus());
        shipmentRepository.save(shipment);

        // "Recalculate the ETA whenever a new tracking event is added" - wrapped so a
        // recalculation failure never rolls back or fails the tracking event itself.
        try {
            etaPredictionService.calculateForShipment(shipmentId);
        } catch (Exception e) {
            log.warn("ETA recalculation failed after tracking event for shipment {}: {}", shipmentId, e.getMessage());
        }

        // Templated TRACKING_UPDATE notification: duplicate-checked, persisted, and
        // emailed. Wrapped so a notification failure never fails the tracking event itself.
        try {
            notificationService.send(NotificationType.SHIPMENT_UPDATE, shipment.getCreatedBy(), shipmentId);
        } catch (Exception e) {
            log.warn("Tracking-update notification failed for shipment {}: {}", shipmentId, e.getMessage());
        }

        return mapToResponse(saved);
    }

    @Override
    public List<TrackingEventResponse> getTimeline(Long shipmentId) {
        return trackingEventRepository.findByShipmentIdOrderByEventTimestampAsc(shipmentId)
                .stream().map(this::mapToResponse).toList();
    }

    @Override
    public TrackingEventResponse getLatest(Long shipmentId) {
        TrackingEvent latest = trackingEventRepository.findFirstByShipmentIdOrderByEventTimestampDesc(shipmentId);
        if (latest == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No tracking events yet for this shipment.");
        }
        return mapToResponse(latest);
    }

    private TrackingEventResponse mapToResponse(TrackingEvent e) {
        return TrackingEventResponse.builder()
                .id(e.getId())
                .shipmentId(e.getShipmentId())
                .updatedBy(e.getUpdatedBy())
                .status(e.getStatus())
                .location(e.getLocation())
                .latitude(e.getLatitude())
                .longitude(e.getLongitude())
                .notes(e.getNotes())
                .eventTimestamp(e.getEventTimestamp())
                .build();
    }
}
