package com.shiptrack.shiptrack_pro.service.impl;

import com.shiptrack.shiptrack_pro.entity.Shipment;
import com.shiptrack.shiptrack_pro.entity.ShipmentStatus;
import com.shiptrack.shiptrack_pro.entity.User;
import com.shiptrack.shiptrack_pro.repository.ShipmentRepository;
import com.shiptrack.shiptrack_pro.repository.UserRepository;
import com.shiptrack.shiptrack_pro.service.ETAService;
import com.shiptrack.shiptrack_pro.service.RouteService;
import com.shiptrack.shiptrack_pro.service.ShipmentService;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Service
public class ShipmentServiceImpl
        implements ShipmentService {

    private final ShipmentRepository shipmentRepository;
    private final UserRepository userRepository;
    private final RouteService routeService;
    private final ETAService etaService;

    public ShipmentServiceImpl(
            ShipmentRepository shipmentRepository,
            UserRepository userRepository,
            RouteService routeService,
            ETAService etaService) {

        this.shipmentRepository = shipmentRepository;
        this.userRepository = userRepository;
        this.routeService = routeService;
        this.etaService = etaService;
    }

    @Override
    public Shipment createShipment(
            Shipment shipment,
            String userEmail) {

        User user = getUser(userEmail);

        // Set authenticated user as shipment creator
        shipment.setCreatedBy(user.getId());

        // Automatically assign the first available
        // Logistics Operator
        User operator = userRepository
                .findFirstByRoleIgnoreCase(
                        "LOGISTICS_OPERATOR"
                )
                .orElseThrow(() ->
                        new RuntimeException(
                                "No logistics operator available"
                        ));

        shipment.setAssignedOperatorId(
                operator.getId()
        );

        // Generate tracking number automatically
        shipment.setTrackingNumber(
                "ST-" + UUID.randomUUID()
                        .toString()
                        .substring(0, 8)
                        .toUpperCase()
        );

        // Do not trust status from frontend
        shipment.setStatus(
                ShipmentStatus.CREATED
        );

        // Save shipment
        Shipment savedShipment =
                shipmentRepository.save(shipment);

        // Automatically create route
        routeService.createRouteFromShipment(
                savedShipment
        );

        // Automatically calculate and save ETA
        etaService.calculateAndSave(
                savedShipment.getId()
        );

        return savedShipment;
    }

    @Override
    public List<Shipment> getShipmentsForUser(
            String userEmail) {

        User user = getUser(userEmail);

        String role =
                user.getRole().toUpperCase();

        if (role.equals("ADMINISTRATOR")
                || role.equals("SUPPORT_AGENT")) {

            return shipmentRepository.findAll();
        }

        if (role.equals("LOGISTICS_OPERATOR")) {

            return shipmentRepository
                    .findByAssignedOperatorId(
                            user.getId()
                    );
        }

        // CUSTOMER and BUSINESS_CLIENT
        return shipmentRepository
                .findByCreatedBy(
                        user.getId()
                );
    }

    @Override
    public Shipment getShipmentByIdForUser(
            Long id,
            String userEmail) {

        User user = getUser(userEmail);

        Shipment shipment =
                getShipmentById(id);

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

        String role =
                user.getRole().toUpperCase();

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

        // CUSTOMER and BUSINESS_CLIENT
        return Objects.equals(
                user.getId(),
                shipment.getCreatedBy()
        );
    }

    private User getUser(String email) {

        return userRepository
                .findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException(
                                "User not found"
                        ));
    }

    @Override
    public Shipment getShipmentById(
            Long id) {

        return shipmentRepository
                .findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Shipment not found with id: "
                                        + id
                        ));
    }

    @Override
    public Shipment updateShipment(
            Long id,
            Shipment updatedShipment) {

        Shipment existingShipment =
                getShipmentById(id);

        // Check whether pickup or delivery
        // location has changed
        boolean locationChanged =
                !Objects.equals(
                        existingShipment.getPickupAddress(),
                        updatedShipment.getPickupAddress()
                )
                ||
                !Objects.equals(
                        existingShipment.getDeliveryAddress(),
                        updatedShipment.getDeliveryAddress()
                );

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

        Shipment savedShipment =
                shipmentRepository.save(
                        existingShipment
                );

        // Recalculate route and ETA if the
        // shipment location changes
        if (locationChanged) {

            routeService.createRouteFromShipment(
                    savedShipment
            );

            etaService.calculateAndSave(
                    savedShipment.getId()
            );
        }

        return savedShipment;
    }

    @Override
    public Shipment updateStatus(
            Long id,
            String status) {

        Shipment shipment =
                getShipmentById(id);

        ShipmentStatus shipmentStatus;

        try {

            shipmentStatus =
                    ShipmentStatus.valueOf(
                            status.toUpperCase()
                    );

        } catch (IllegalArgumentException e) {

            throw new RuntimeException(
                    "Invalid shipment status: "
                            + status
            );
        }

        shipment.setStatus(
                shipmentStatus
        );

        // Set actual delivery date
        // when shipment is delivered
        if (shipmentStatus ==
                ShipmentStatus.DELIVERED) {

            shipment.setActualDeliveryDate(
                    LocalDate.now()
            );
        }

        Shipment savedShipment =
                shipmentRepository.save(
                        shipment
                );

        // Recalculate ETA during active
        // shipment stages
        if (shipmentStatus ==
                    ShipmentStatus.PICKED_UP
                || shipmentStatus ==
                    ShipmentStatus.IN_TRANSIT
                || shipmentStatus ==
                    ShipmentStatus.OUT_FOR_DELIVERY) {

            try {

                etaService.calculateAndSave(
                        savedShipment.getId()
                );

            } catch (Exception e) {

                System.out.println(
                        "ETA recalculation failed for shipment "
                                + savedShipment.getId()
                                + ": "
                                + e.getMessage()
                );
            }
        }

        return savedShipment;
    }

    @Override
    public void cancelShipment(
            Long id) {

        Shipment shipment =
                getShipmentById(id);

        shipment.setStatus(
                ShipmentStatus.CANCELLED
        );

        shipment.setCancelledAt(
                LocalDateTime.now()
        );

        shipmentRepository.save(
                shipment
        );
    }
}