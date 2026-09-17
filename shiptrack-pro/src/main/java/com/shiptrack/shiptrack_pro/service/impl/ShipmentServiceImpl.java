package com.shiptrack.shiptrack_pro.service.impl;

import com.shiptrack.shiptrack_pro.dto.PackageRequest;
import com.shiptrack.shiptrack_pro.dto.PackageResponse;
import com.shiptrack.shiptrack_pro.dto.ShipmentRequest;
import com.shiptrack.shiptrack_pro.dto.ShipmentResponse;
import com.shiptrack.shiptrack_pro.entity.Package;
import com.shiptrack.shiptrack_pro.entity.Shipment;
import com.shiptrack.shiptrack_pro.entity.ShipmentStatus;
import com.shiptrack.shiptrack_pro.entity.User;
import com.shiptrack.shiptrack_pro.repository.ShipmentRepository;
import com.shiptrack.shiptrack_pro.repository.UserRepository;
import com.shiptrack.shiptrack_pro.service.ShipmentService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ShipmentServiceImpl implements ShipmentService {

    private final ShipmentRepository shipmentRepository;
    private final UserRepository userRepository;


    // =========================================================
    // CREATE SHIPMENT
    // =========================================================

    @Override
    public ShipmentResponse createShipment(
            ShipmentRequest request) {

        // Get logged-in user
        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (authentication == null ||
                !authentication.isAuthenticated()) {

            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "User is not authenticated"
            );
        }

        String email = authentication.getName();

        User loggedInUser =
                userRepository.findByEmail(email)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.UNAUTHORIZED,
                                        "Logged-in user not found"
                                )
                        );


        // Generate tracking number
        String trackingNumber =
                "STP-" +
                        UUID.randomUUID()
                                .toString()
                                .substring(0, 8)
                                .toUpperCase();


        // Create shipment
        Shipment shipment =
                Shipment.builder()

                        .trackingNumber(
                                trackingNumber
                        )

                        .senderName(
                                request.getSenderName()
                        )

                        .senderPhone(
                                request.getSenderPhone()
                        )

                        .senderAddress(
                                request.getSenderAddress()
                        )

                        .receiverName(
                                request.getReceiverName()
                        )

                        .receiverPhone(
                                request.getReceiverPhone()
                        )

                        .receiverEmail(
                                request.getReceiverEmail()
                        )

                        .receiverAddress(
                                request.getReceiverAddress()
                        )

                        .pickupAddress(
                                request.getPickupAddress()
                        )

                        .deliveryAddress(
                                request.getDeliveryAddress()
                        )

                        .priority(
                                request.getPriority()
                        )

                        .status(
                                ShipmentStatus.CREATED
                        )

                        // Link shipment to logged-in customer
                        .customer(
                                loggedInUser
                        )

                        .build();


        // =====================================================
        // SAVE PACKAGES
        // =====================================================

        if (request.getPackages() != null) {

            for (PackageRequest packageRequest :
                    request.getPackages()) {

                Package packageEntity =
                        Package.builder()

                                .packageDescription(
                                        packageRequest
                                                .getPackageDescription()
                                )

                                .weight(
                                        packageRequest.getWeight()
                                )

                                .dimensions(
                                        packageRequest.getDimensions()
                                )

                                .quantity(
                                        packageRequest.getQuantity()
                                )

                                .declaredValue(
                                        packageRequest
                                                .getDeclaredValue()
                                )

                                .fragile(
                                        packageRequest.getFragile()
                                )

                                // Link package to shipment
                                .shipment(
                                        shipment
                                )

                                .build();


                shipment.getPackages()
                        .add(packageEntity);
            }
        }


        // Save shipment
        Shipment savedShipment =
                shipmentRepository.save(
                        shipment
                );


        return mapToResponse(
                savedShipment
        );
    }


    // =========================================================
    // GET ALL SHIPMENTS
    // =========================================================

    @Override
    public List<ShipmentResponse> getAllShipments() {

        // Get logged-in user
        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();


        if (authentication == null ||
                !authentication.isAuthenticated()) {

            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "User is not authenticated"
            );
        }


        String email =
                authentication.getName();


        User loggedInUser =
                userRepository.findByEmail(email)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.UNAUTHORIZED,
                                        "Logged-in user not found"
                                )
                        );


        String role =
                loggedInUser.getRole();


        List<Shipment> shipments;


        // =====================================================
        // ADMIN
        // ADMIN CAN SEE ALL SHIPMENTS
        // =====================================================

        if ("ADMIN".equalsIgnoreCase(role)) {

            shipments =
                    shipmentRepository.findAll();
        }


        // =====================================================
        // LOGISTICS OPERATOR
        // LOGISTICS OPERATOR CAN SEE ALL SHIPMENTS
        // =====================================================

        else if (
                "LOGISTICS_OPERATOR".equalsIgnoreCase(role)
                        ||
                        "OPERATOR".equalsIgnoreCase(role)
        ) {

            shipments =
                    shipmentRepository.findAll();
        }


        // =====================================================
        // CUSTOMER
        // CUSTOMER CAN SEE ONLY THEIR OWN SHIPMENTS
        // =====================================================

        else {

            shipments =
                    shipmentRepository
                            .findByCustomerId(
                                    loggedInUser.getId()
                            );
        }


        // Convert entities to responses
        return shipments
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }


    // =========================================================
    // GET SHIPMENT BY ID
    // =========================================================

    @Override
    public ShipmentResponse getShipmentById(
            Long id) {

        Shipment shipment =
                shipmentRepository
                        .findById(id)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Shipment not found with id: "
                                                + id
                                )
                        );


        return mapToResponse(
                shipment
        );
    }


    // =========================================================
    // UPDATE SHIPMENT STATUS
    // =========================================================

    @Override
    public ShipmentResponse updateShipmentStatus(
            Long id,
            String status) {

        Shipment shipment =
                shipmentRepository
                        .findById(id)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Shipment not found with id: "
                                                + id
                                )
                        );


        try {

            ShipmentStatus newStatus =
                    ShipmentStatus.valueOf(
                            status.toUpperCase()
                    );


            shipment.setStatus(
                    newStatus
            );

        } catch (IllegalArgumentException e) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid shipment status: "
                            + status
            );
        }


        Shipment updatedShipment =
                shipmentRepository.save(
                        shipment
                );


        return mapToResponse(
                updatedShipment
        );
    }


    // =========================================================
    // CANCEL SHIPMENT
    // =========================================================

    @Override
    public void cancelShipment(
            Long id) {

        Shipment shipment =
                shipmentRepository
                        .findById(id)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Shipment not found with id: "
                                                + id
                                )
                        );


        shipment.setStatus(
                ShipmentStatus.CANCELLED
        );


        shipmentRepository.save(
                shipment
        );
    }


    // =========================================================
    // MAP ENTITY → RESPONSE
    // =========================================================

    private ShipmentResponse mapToResponse(
            Shipment shipment) {


        // -----------------------------------------------------
        // Convert packages
        // -----------------------------------------------------

        List<PackageResponse> packageResponses =
                shipment.getPackages()
                        .stream()
                        .map(packageEntity ->

                                PackageResponse.builder()

                                        .id(
                                                packageEntity
                                                        .getId()
                                        )

                                        .packageDescription(
                                                packageEntity
                                                        .getPackageDescription()
                                        )

                                        .weight(
                                                packageEntity
                                                        .getWeight()
                                        )

                                        .dimensions(
                                                packageEntity
                                                        .getDimensions()
                                        )

                                        .quantity(
                                                packageEntity
                                                        .getQuantity()
                                        )

                                        .declaredValue(
                                                packageEntity
                                                        .getDeclaredValue()
                                        )

                                        .fragile(
                                                packageEntity
                                                        .getFragile()
                                        )

                                        .build()
                        )
                        .collect(
                                Collectors.toList()
                        );


        // -----------------------------------------------------
        // Build response
        // -----------------------------------------------------

        return ShipmentResponse.builder()

                .id(
                        shipment.getId()
                )

                .trackingNumber(
                        shipment.getTrackingNumber()
                )

                .senderName(
                        shipment.getSenderName()
                )

                .senderPhone(
                        shipment.getSenderPhone()
                )

                .senderAddress(
                        shipment.getSenderAddress()
                )

                .receiverName(
                        shipment.getReceiverName()
                )

                .receiverPhone(
                        shipment.getReceiverPhone()
                )

                .receiverEmail(
                        shipment.getReceiverEmail()
                )

                .receiverAddress(
                        shipment.getReceiverAddress()
                )

                .pickupAddress(
                        shipment.getPickupAddress()
                )

                .deliveryAddress(
                        shipment.getDeliveryAddress()
                )

                .status(
                        shipment.getStatus() != null
                                ? shipment
                                .getStatus()
                                .name()
                                : null
                )

                .priority(
                        shipment.getPriority()
                )

                .estimatedDeliveryDate(
                        shipment
                                .getEstimatedDeliveryDate()
                )

                .actualDeliveryDate(
                        shipment
                                .getActualDeliveryDate()
                )

                .cancellationReason(
                        shipment
                                .getCancellationReason()
                )

                .packages(
                        packageResponses
                )

                .createdAt(
                        shipment.getCreatedAt()
                )

                .updatedAt(
                        shipment.getUpdatedAt()
                )

                .build();
    }
}