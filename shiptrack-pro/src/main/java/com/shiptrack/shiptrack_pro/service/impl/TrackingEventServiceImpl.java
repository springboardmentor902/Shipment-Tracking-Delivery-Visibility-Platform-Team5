package com.shiptrack.shiptrack_pro.service.impl;

import com.shiptrack.shiptrack_pro.dto.TrackingEventRequest;
import com.shiptrack.shiptrack_pro.entity.Shipment;
import com.shiptrack.shiptrack_pro.entity.TrackingEvent;
import com.shiptrack.shiptrack_pro.repository.ShipmentRepository;
import com.shiptrack.shiptrack_pro.repository.TrackingEventRepository;
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
    private final ShipmentRepository shipmentRepository;

    @Override
    public TrackingEvent addEvent(
            Long shipmentId,
            TrackingEventRequest request) {

        Shipment shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Shipment not found with id: " + shipmentId
                ));

        // FIXED LOGIC: Standard object instantiation (No Lombok builder)
        TrackingEvent event = new TrackingEvent();
        event.setShipmentId(shipment.getId());
        event.setStatus(request.getStatus());
        event.setLocation(request.getLocation());
        event.setNotes(request.getNotes());
        event.setEventTimestamp(LocalDateTime.now());

        return trackingEventRepository.save(event);
    }

    @Override
    public List<TrackingEvent> getHistory(Long shipmentId) {

        if (!shipmentRepository.existsById(shipmentId)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Shipment not found with id: " + shipmentId
            );
        }

        // FIXED LOGIC: Changed 'Asc' to 'Desc' to match the repository method
        return trackingEventRepository
                .findByShipmentIdOrderByEventTimestampDesc(shipmentId);
    }
}