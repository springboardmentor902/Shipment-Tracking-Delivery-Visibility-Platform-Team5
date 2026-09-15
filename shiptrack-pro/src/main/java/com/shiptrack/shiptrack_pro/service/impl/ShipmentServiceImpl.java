package com.shiptrack.shiptrack_pro.service.impl;

import com.shiptrack.shiptrack_pro.entity.Shipment;
import com.shiptrack.shiptrack_pro.entity.ShipmentStatus;
import com.shiptrack.shiptrack_pro.entity.TrackingEvent;
import com.shiptrack.shiptrack_pro.entity.User;
import com.shiptrack.shiptrack_pro.repository.ShipmentRepository;
import com.shiptrack.shiptrack_pro.repository.TrackingEventRepository;
import com.shiptrack.shiptrack_pro.repository.UserRepository;
import com.shiptrack.shiptrack_pro.service.GoogleMapsService;
import com.shiptrack.shiptrack_pro.service.ShipmentService;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Service
public class ShipmentServiceImpl implements ShipmentService {

    private final ShipmentRepository shipmentRepository;
    private final UserRepository userRepository;
    private final GoogleMapsService googleMapsService;
    private final TrackingEventRepository trackingEventRepository; // Added dependency

    public ShipmentServiceImpl(
            ShipmentRepository shipmentRepository,
            UserRepository userRepository,
            GoogleMapsService googleMapsService,
            TrackingEventRepository trackingEventRepository) {

        this.shipmentRepository = shipmentRepository;
        this.userRepository = userRepository;
        this.googleMapsService = googleMapsService;
        this.trackingEventRepository = trackingEventRepository;
    }

    @Override
    public Shipment createShipment(
            Shipment shipment,
            String userEmail) {

        User user = getUser(userEmail);

        shipment.setCreatedBy(user.getId());
        shipment.setStatus(ShipmentStatus.CREATED);

        String generatedTrackingNumber = "TRK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        shipment.setTrackingNumber(generatedTrackingNumber);

        try {
            GoogleMapsService.RouteDetails route = googleMapsService.calculateRoute(
                    shipment.getPickupAddress(),
                    shipment.getDeliveryAddress()
            );
            
            if (route != null) {
                shipment.setDistanceKm(route.distanceKm());
                shipment.setEstimatedTimeMinutes(route.estimatedTimeMinutes());
            }
        } catch (Exception e) {
            System.out.println("Could not calculate route during creation: " + e.getMessage());
        }

        return shipmentRepository.save(shipment);
    }

    @Override
    public List<Shipment> getShipmentsForUser(String userEmail) {
        User user = getUser(userEmail);
        String role = user.getRole().toUpperCase();

        if (role.equals("ADMINISTRATOR") || role.equals("SUPPORT_AGENT")) {
            return shipmentRepository.findAll();
        }

        if (role.equals("LOGISTICS_OPERATOR")) {
            return shipmentRepository.findByAssignedOperatorId(user.getId());
        }

        return shipmentRepository.findByCreatedBy(user.getId());
    }

    @Override
    public Shipment getShipmentByIdForUser(Long id, String userEmail) {
        User user = getUser(userEmail);
        Shipment shipment = getShipmentById(id);

        if (!canViewShipment(user, shipment)) {
            throw new AccessDeniedException("You cannot view this shipment");
        }

        return shipment;
    }

    private boolean canViewShipment(User user, Shipment shipment) {
        String role = user.getRole().toUpperCase();

        if (role.equals("ADMINISTRATOR") || role.equals("SUPPORT_AGENT")) {
            return true;
        }

        if (role.equals("LOGISTICS_OPERATOR")) {
            return Objects.equals(user.getId(), shipment.getAssignedOperatorId());
        }

        return Objects.equals(user.getId(), shipment.getCreatedBy());
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @Override
    public Shipment getShipmentById(Long id) {
        return shipmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Shipment not found with id: " + id));
    }

    @Override
    public Shipment updateShipment(Long id, Shipment updatedShipment) {
        Shipment existingShipment = getShipmentById(id);

        existingShipment.setSenderName(updatedShipment.getSenderName());
        existingShipment.setSenderPhone(updatedShipment.getSenderPhone());
        existingShipment.setSenderAddress(updatedShipment.getSenderAddress());

        existingShipment.setReceiverName(updatedShipment.getReceiverName());
        existingShipment.setReceiverPhone(updatedShipment.getReceiverPhone());
        existingShipment.setReceiverEmail(updatedShipment.getReceiverEmail());
        existingShipment.setReceiverAddress(updatedShipment.getReceiverAddress());

        existingShipment.setPickupAddress(updatedShipment.getPickupAddress());
        existingShipment.setDeliveryAddress(updatedShipment.getDeliveryAddress());

        existingShipment.setPriority(updatedShipment.getPriority());
        existingShipment.setEstimatedDeliveryDate(updatedShipment.getEstimatedDeliveryDate());

        return shipmentRepository.save(existingShipment);
    }

    @Override
    public Shipment updateStatus(Long id, String status) {
        Shipment shipment = getShipmentById(id);
        ShipmentStatus shipmentStatus;

        try {
            shipmentStatus = ShipmentStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid shipment status: " + status);
        }

        shipment.setStatus(shipmentStatus);

        if (shipmentStatus == ShipmentStatus.DELIVERED) {
            shipment.setActualDeliveryDate(LocalDate.now());
        }

        // Save the shipment first
        Shipment savedShipment = shipmentRepository.save(shipment);

        // FIXED LOGIC: Standard object instantiation (No Lombok builder)
        TrackingEvent event = new TrackingEvent();
        event.setShipmentId(savedShipment.getId());
        event.setStatus(shipmentStatus.name());
        event.setLocation(savedShipment.getPickupAddress()); // Defaulting to pickup location
        event.setNotes("Shipment status updated to " + shipmentStatus);
        event.setEventTimestamp(LocalDateTime.now());
        
        trackingEventRepository.save(event);

        return savedShipment;
    }

    @Override
    public void cancelShipment(Long id) {
        Shipment shipment = getShipmentById(id);
        shipment.setStatus(ShipmentStatus.CANCELLED);
        shipment.setCancelledAt(LocalDateTime.now());
        shipmentRepository.save(shipment);
    }

    // FIXED LOGIC: Method signature updated to match eventTimestamp
    @Override
    public List<TrackingEvent> getTrackingHistory(Long shipmentId) {
        return trackingEventRepository.findByShipmentIdOrderByEventTimestampDesc(shipmentId);
    }
}