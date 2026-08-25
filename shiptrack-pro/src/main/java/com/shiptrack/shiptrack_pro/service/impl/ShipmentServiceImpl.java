package com.shiptrack.shiptrack_pro.service.impl;

import com.shiptrack.shiptrack_pro.entity.Shipment;
import com.shiptrack.shiptrack_pro.entity.ShipmentStatus;
import com.shiptrack.shiptrack_pro.entity.User;
import com.shiptrack.shiptrack_pro.repository.ShipmentRepository;
import com.shiptrack.shiptrack_pro.repository.UserRepository;
import com.shiptrack.shiptrack_pro.service.ShipmentService;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

@Service
public class ShipmentServiceImpl
        implements ShipmentService {

    private final ShipmentRepository shipmentRepository;
    private final UserRepository userRepository;

    public ShipmentServiceImpl(
            ShipmentRepository shipmentRepository,
            UserRepository userRepository) {

        this.shipmentRepository = shipmentRepository;
        this.userRepository = userRepository;
    }

    @Override
    public Shipment createShipment(
            Shipment shipment,
            String userEmail) {

        User user = getUser(userEmail);

        // This must come from the authenticated user
        shipment.setCreatedBy(user.getId());

        // Do not trust status from frontend
        shipment.setStatus(ShipmentStatus.CREATED);

        return shipmentRepository.save(shipment);
    }

    @Override
    public List<Shipment> getShipmentsForUser(
            String userEmail) {

        User user = getUser(userEmail);
        String role = user.getRole().toUpperCase();

        if (role.equals("ADMINISTRATOR")
                || role.equals("SUPPORT_AGENT")) {

            return shipmentRepository.findAll();
        }

        if (role.equals("LOGISTICS_OPERATOR")) {

            return shipmentRepository
                    .findByAssignedOperatorId(user.getId());
        }

        // CUSTOMER and BUSINESS_CLIENT
        return shipmentRepository
                .findByCreatedBy(user.getId());
    }

    @Override
    public Shipment getShipmentByIdForUser(
            Long id,
            String userEmail) {

        User user = getUser(userEmail);
        Shipment shipment = getShipmentById(id);

        if (!canViewShipment(user, shipment)) {
            throw new AccessDeniedException(
                    "You cannot view this shipment"
            );
        }

        return shipment;
    }

    private boolean canViewShipment(
            User user,
            Shipment shipment) {

        String role = user.getRole().toUpperCase();

        if (role.equals("ADMINISTRATOR")
                || role.equals("SUPPORT_AGENT")) {

            return true;
        }

        if (role.equals("LOGISTICS_OPERATOR")) {
            return Objects.equals(
                    user.getId(),
                    shipment.getAssignedOperatorId()
            );
        }

        return Objects.equals(
                user.getId(),
                shipment.getCreatedBy()
        );
    }

    private User getUser(String email) {

        return userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));
    }

    @Override
    public Shipment getShipmentById(Long id) {

        return shipmentRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Shipment not found with id: " + id
                        ));
    }

    @Override
    public Shipment updateShipment(
            Long id,
            Shipment updatedShipment) {

        Shipment existingShipment = getShipmentById(id);

        existingShipment.setSenderName(
                updatedShipment.getSenderName()
        );
        existingShipment.setSenderPhone(
                updatedShipment.getSenderPhone()
        );
        existingShipment.setSenderAddress(
                updatedShipment.getSenderAddress()
        );

        existingShipment.setReceiverName(
                updatedShipment.getReceiverName()
        );
        existingShipment.setReceiverPhone(
                updatedShipment.getReceiverPhone()
        );
        existingShipment.setReceiverEmail(
                updatedShipment.getReceiverEmail()
        );
        existingShipment.setReceiverAddress(
                updatedShipment.getReceiverAddress()
        );

        existingShipment.setPickupAddress(
                updatedShipment.getPickupAddress()
        );
        existingShipment.setDeliveryAddress(
                updatedShipment.getDeliveryAddress()
        );

        existingShipment.setPriority(
                updatedShipment.getPriority()
        );
        existingShipment.setEstimatedDeliveryDate(
                updatedShipment.getEstimatedDeliveryDate()
        );

        return shipmentRepository.save(existingShipment);
    }

    @Override
    public Shipment updateStatus(
            Long id,
            String status) {

        Shipment shipment = getShipmentById(id);

        ShipmentStatus shipmentStatus;

        try {
            shipmentStatus = ShipmentStatus.valueOf(
                    status.toUpperCase()
            );
        } catch (IllegalArgumentException e) {
            throw new RuntimeException(
                    "Invalid shipment status: " + status
            );
        }

        shipment.setStatus(shipmentStatus);

        if (shipmentStatus == ShipmentStatus.DELIVERED) {
            shipment.setActualDeliveryDate(
                    LocalDate.now()
            );
        }

        return shipmentRepository.save(shipment);
    }

    @Override
    public void cancelShipment(Long id) {

        Shipment shipment = getShipmentById(id);

        shipment.setStatus(
                ShipmentStatus.CANCELLED
        );
        shipment.setCancelledAt(
                LocalDateTime.now()
        );

        shipmentRepository.save(shipment);
    }
}