package com.shiptrack.shiptrack_pro.service.impl;

import com.shiptrack.shiptrack_pro.dto.TrackingEventRequest;
import com.shiptrack.shiptrack_pro.entity.Shipment;
import com.shiptrack.shiptrack_pro.entity.TrackingEvent;
import com.shiptrack.shiptrack_pro.repository.ShipmentRepository;
import com.shiptrack.shiptrack_pro.repository.TrackingEventRepository;
import com.shiptrack.shiptrack_pro.service.ETAService;
import com.shiptrack.shiptrack_pro.service.NotificationService;
import com.shiptrack.shiptrack_pro.service.TrackingEventService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TrackingEventServiceImpl implements TrackingEventService {

    private final TrackingEventRepository trackingEventRepository;
    private final NotificationService notificationService;
    private final ShipmentRepository shipmentRepository;
    private final ETAService etaService;

    @Override
    public TrackingEvent addEvent(
            Long shipmentId,
            TrackingEventRequest request) {

        Shipment shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Shipment not found with id: " + shipmentId
                ));

        TrackingEvent event = TrackingEvent.builder()
                .shipmentId(shipment.getId())
                .status(request.getStatus())
                .location(request.getLocation())
                .notes(request.getNotes())
                .eventTimestamp(LocalDateTime.now())
                .build();

        TrackingEvent savedEvent =
                trackingEventRepository.save(event);

        // Recalculate ETA after a new tracking event
        etaService.calculateAndSave(shipmentId);

        // Create notification for the shipment update
        if (shipment.getCreatedBy() != null) {
            notificationService.createNotification(
                    shipment.getCreatedBy(),
                    shipmentId,
                    "Shipment Update",
                    "Shipment " + shipment.getTrackingNumber()
                            + " has a new tracking update: "
                            + request.getStatus(),
                    "SHIPMENT_UPDATE"
            );
        }

        return savedEvent;
    }

    @Override
    public List<TrackingEvent> getHistory(Long shipmentId) {

        if (!shipmentRepository.existsById(shipmentId)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Shipment not found with id: " + shipmentId
            );
        }

        return trackingEventRepository
                .findByShipmentIdOrderByEventTimestampAsc(shipmentId);
    }
}