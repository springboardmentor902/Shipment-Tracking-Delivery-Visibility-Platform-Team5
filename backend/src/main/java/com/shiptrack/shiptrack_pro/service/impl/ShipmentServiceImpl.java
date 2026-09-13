package com.shiptrack.shiptrack_pro.service.impl;

import com.shiptrack.shiptrack_pro.dto.*;
import com.shiptrack.shiptrack_pro.entity.PackageItem;
import com.shiptrack.shiptrack_pro.entity.Shipment;
import com.shiptrack.shiptrack_pro.entity.TrackingEvent;
import com.shiptrack.shiptrack_pro.entity.User;
import com.shiptrack.shiptrack_pro.repository.BusinessAccountRepository;
import com.shiptrack.shiptrack_pro.repository.PackageItemRepository;
import com.shiptrack.shiptrack_pro.repository.ShipmentRepository;
import com.shiptrack.shiptrack_pro.repository.TrackingEventRepository;
import com.shiptrack.shiptrack_pro.repository.UserRepository;
import com.shiptrack.shiptrack_pro.service.EmailService;
import com.shiptrack.shiptrack_pro.service.EtaPredictionService;
import com.shiptrack.shiptrack_pro.service.NotificationService;
import com.shiptrack.shiptrack_pro.service.ShipmentService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ShipmentServiceImpl implements ShipmentService {

    private static final Logger log =
            LoggerFactory.getLogger(ShipmentServiceImpl.class);

    private static final Set<String> VALID_STATUSES = Set.of(
            "CREATED",
            "PICKED_UP",
            "IN_TRANSIT",
            "OUT_FOR_DELIVERY",
            "DELIVERED",
            "FAILED_DELIVERY",
            "CANCELLED"
    );

    private final ShipmentRepository shipmentRepository;
    private final PackageItemRepository packageRepository;
    private final BusinessAccountRepository businessAccountRepository;
    private final TrackingEventRepository trackingEventRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final EtaPredictionService etaPredictionService;
    private final EmailService emailService;

    private final SecureRandom random = new SecureRandom();

    // -------------------------------------------------------------------------
    // Create shipment
    // -------------------------------------------------------------------------

    @Override
    @Transactional
    public ShipmentResponse createShipment(
            String creatorEmail,
            ShipmentCreateRequest request
    ) {
        User creator = userRepository.findByEmail(creatorEmail)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found"
                ));

        /*
         * businessId is optional.
         *
         * Customers can create shipments without a business account.
         * Business clients can create shipments with their businessId.
         */
        Long businessId = request.getBusinessId();

        if (businessId != null) {
            businessAccountRepository.findById(businessId)
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND,
                            "Business account not found"
                    ));
        }

        Shipment shipment = Shipment.builder()
                .trackingNumber(generateTrackingNumber())
                .createdBy(creator.getId())
                .businessId(businessId)
                .senderName(request.getSenderName())
                .senderPhone(request.getSenderPhone())
                .senderAddress(request.getSenderAddress())
                .receiverName(request.getReceiverName())
                .receiverPhone(request.getReceiverPhone())
                .receiverEmail(request.getReceiverEmail())
                .receiverAddress(request.getReceiverAddress())
                .pickupAddress(request.getPickupAddress())
                .deliveryAddress(request.getDeliveryAddress())
                .priority(
                        request.getPriority() == null
                                ? "STANDARD"
                                : request.getPriority().toUpperCase()
                )
                .status("CREATED")
                .build();

        Shipment saved = shipmentRepository.save(shipment);

        if (request.getPackages() != null) {
            request.getPackages().forEach(pkgReq -> {
                PackageItem packageItem = PackageItem.builder()
                        .shipmentId(saved.getId())
                        .description(pkgReq.getDescription())
                        .weightKg(pkgReq.getWeightKg())
                        .lengthCm(pkgReq.getLengthCm())
                        .widthCm(pkgReq.getWidthCm())
                        .heightCm(pkgReq.getHeightCm())
                        .quantity(pkgReq.getQuantity())
                        .declaredValue(pkgReq.getDeclaredValue())
                        .fragile(Boolean.TRUE.equals(pkgReq.getFragile()))
                        .build();

                packageRepository.save(packageItem);
            });
        }

        logTrackingEvent(
                saved.getId(),
                creator.getId(),
                "CREATED",
                request.getPickupAddress(),
                "Shipment created"
        );

        try {
            etaPredictionService.calculateForShipment(saved.getId());
        } catch (Exception e) {
            log.warn(
                    "Initial ETA calculation failed for shipment {}: {}",
                    saved.getId(),
                    e.getMessage()
            );
        }

        sendInAppNotification(
                creator.getId(),
                saved.getId(),
                "Shipment Created",
                "Your shipment " + saved.getTrackingNumber()
                        + " has been created."
        );

        /*
         * Send email to the receiver.
         * Email failure must not fail shipment creation.
         */
        sendShipmentEmail(
                request.getReceiverEmail(),
                "Shipment Created",
                "Your shipment " + saved.getTrackingNumber()
                        + " has been created."
        );

        return mapToResponse(
                shipmentRepository.findById(saved.getId()).orElse(saved)
        );
    }

    // -------------------------------------------------------------------------
    // Get shipment
    // -------------------------------------------------------------------------

    @Override
    public ShipmentResponse getById(Long id) {
        return mapToResponse(findShipmentOrThrow(id));
    }

    @Override
    public ShipmentResponse getByTrackingNumber(String trackingNumber) {
        Shipment shipment = shipmentRepository
                .findByTrackingNumber(trackingNumber)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "No shipment found with tracking number: "
                                + trackingNumber
                ));

        return mapToResponse(shipment);
    }

    @Override
    public List<ShipmentResponse> getAll() {
        return shipmentRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public List<ShipmentResponse> getForCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found"
                ));

        String normalizedRole = normalizeRole(user.getRole());

        return resolveAccessibleShipments(
                user.getId(),
                normalizedRole
        )
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    // -------------------------------------------------------------------------
    // Access control
    // -------------------------------------------------------------------------

    @Override
    public List<Shipment> resolveAccessibleShipments(
            Long userId,
            String role
    ) {
        String normalizedRole = normalizeRole(role);

        return switch (normalizedRole) {
            case "LOGISTICS_OPERATOR" ->
                    shipmentRepository.findByAssignedOperatorId(userId);

            case "ADMINISTRATOR", "ADMIN" ->
                    shipmentRepository.findAll();

            case "BUSINESS_CLIENT" ->
                    businessAccountRepository.findByUserId(userId)
                            .map(account ->
                                    shipmentRepository.findByBusinessId(
                                            account.getId()
                                    )
                            )
                            .orElse(List.of());

            case "CUSTOMER" ->
                    shipmentRepository.findByCreatedBy(userId);

            default ->
                    shipmentRepository.findByCreatedBy(userId);
        };
    }

    // -------------------------------------------------------------------------
    // Update shipment details
    // -------------------------------------------------------------------------

    @Override
    @Transactional
    public ShipmentResponse updateShipment(
            Long id,
            ShipmentUpdateRequest request
    ) {
        Shipment shipment = findShipmentOrThrow(id);

        if (request.getSenderName() != null) {
            shipment.setSenderName(request.getSenderName());
        }

        if (request.getSenderPhone() != null) {
            shipment.setSenderPhone(request.getSenderPhone());
        }

        if (request.getSenderAddress() != null) {
            shipment.setSenderAddress(request.getSenderAddress());
        }

        if (request.getReceiverName() != null) {
            shipment.setReceiverName(request.getReceiverName());
        }

        if (request.getReceiverPhone() != null) {
            shipment.setReceiverPhone(request.getReceiverPhone());
        }

        if (request.getReceiverEmail() != null) {
            shipment.setReceiverEmail(request.getReceiverEmail());
        }

        if (request.getReceiverAddress() != null) {
            shipment.setReceiverAddress(request.getReceiverAddress());
        }

        if (request.getPickupAddress() != null) {
            shipment.setPickupAddress(request.getPickupAddress());
        }

        if (request.getDeliveryAddress() != null) {
            shipment.setDeliveryAddress(request.getDeliveryAddress());
        }

        if (request.getPriority() != null) {
            shipment.setPriority(request.getPriority().toUpperCase());
        }

        if (request.getAssignedOperatorId() != null) {
            shipment.setAssignedOperatorId(
                    request.getAssignedOperatorId()
            );
        }

        return mapToResponse(shipmentRepository.save(shipment));
    }

    // -------------------------------------------------------------------------
    // Update shipment status
    // -------------------------------------------------------------------------

    @Override
    @Transactional
    public ShipmentResponse updateStatus(
            Long id,
            String newStatus,
            Long updatedByUserId,
            String requesterRole
    ) {
        Shipment shipment = findShipmentOrThrow(id);

        if (newStatus == null || newStatus.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Shipment status is required."
            );
        }

        String status = newStatus.toUpperCase();
        String normalizedRole = normalizeRole(requesterRole);

        if ("BUSINESS_CLIENT".equals(normalizedRole)
                && !belongsToBusinessOf(shipment, updatedByUserId)) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You can only update shipments belonging to your own business."
            );
        }

        if ("CUSTOMER".equals(normalizedRole)
                && !shipment.getCreatedBy().equals(updatedByUserId)) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You can only update your own shipments."
            );
        }

        if (!VALID_STATUSES.contains(status)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid status: " + newStatus
                            + ". Must be one of: " + VALID_STATUSES
            );
        }

        if ("CANCELLED".equals(shipment.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Cancelled shipments cannot be updated."
            );
        }

        if ("DELIVERED".equals(shipment.getStatus())
                && !"DELIVERED".equals(status)) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Delivered shipments cannot be moved to another status."
            );
        }

        shipment.setStatus(status);

        if ("DELIVERED".equals(status)) {
            shipment.setActualDeliveryDate(LocalDate.now());
        }

        Shipment saved = shipmentRepository.save(shipment);

        logTrackingEvent(
                id,
                updatedByUserId,
                status,
                shipment.getDeliveryAddress(),
                "Status updated to " + status
        );

        sendInAppNotification(
                shipment.getCreatedBy(),
                id,
                "Shipment " + status.replace('_', ' '),
                "Your shipment "
                        + shipment.getTrackingNumber()
                        + " is now "
                        + status.replace('_', ' ')
                        + "."
        );

        sendShipmentEmail(
                shipment.getReceiverEmail(),
                "Shipment Status Updated",
                "Your shipment "
                        + shipment.getTrackingNumber()
                        + " is now "
                        + status.replace('_', ' ')
                        + "."
        );

        try {
            etaPredictionService.calculateForShipment(id);
        } catch (Exception e) {
            log.warn(
                    "ETA recalculation failed after status update for shipment {}: {}",
                    id,
                    e.getMessage()
            );
        }

        return mapToResponse(saved);
    }

    // -------------------------------------------------------------------------
    // Cancel shipment
    // -------------------------------------------------------------------------

    @Override
    @Transactional
    public ShipmentResponse cancelShipment(
            Long id,
            ShipmentCancelRequest request
    ) {
        Shipment shipment = findShipmentOrThrow(id);

        if ("DELIVERED".equals(shipment.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "A delivered shipment cannot be cancelled."
            );
        }

        if ("CANCELLED".equals(shipment.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Shipment is already cancelled."
            );
        }

        shipment.setStatus("CANCELLED");
        shipment.setCancelledAt(LocalDateTime.now());

        if (request != null) {
            shipment.setCancellationReason(
                    request.getCancellationReason()
            );
        }

        Shipment saved = shipmentRepository.save(shipment);

        logTrackingEvent(
                id,
                shipment.getCreatedBy(),
                "CANCELLED",
                null,
                "Shipment cancelled: "
                        + shipment.getCancellationReason()
        );

        sendInAppNotification(
                shipment.getCreatedBy(),
                id,
                "Shipment Cancelled",
                "Your shipment "
                        + shipment.getTrackingNumber()
                        + " has been cancelled."
        );

        sendShipmentEmail(
                shipment.getReceiverEmail(),
                "Shipment Cancelled",
                "Your shipment "
                        + shipment.getTrackingNumber()
                        + " has been cancelled."
        );

        try {
            etaPredictionService.calculateForShipment(id);
        } catch (Exception e) {
            log.warn(
                    "ETA recalculation failed after cancellation for shipment {}: {}",
                    id,
                    e.getMessage()
            );
        }

        return mapToResponse(saved);
    }

    // -------------------------------------------------------------------------
    // Assign logistics operator
    // -------------------------------------------------------------------------

    @Override
    @Transactional
    public ShipmentResponse assignOperator(
            Long id,
            Long operatorId
    ) {
        Shipment shipment = findShipmentOrThrow(id);

        User operator = userRepository.findById(operatorId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Operator not found"
                ));

        String operatorRole = normalizeRole(operator.getRole());

        if (!"LOGISTICS_OPERATOR".equals(operatorRole)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "User " + operatorId
                            + " is not a LOGISTICS_OPERATOR."
            );
        }

        shipment.setAssignedOperatorId(operatorId);

        return mapToResponse(shipmentRepository.save(shipment));
    }

    // -------------------------------------------------------------------------
    // Helper methods
    // -------------------------------------------------------------------------

    private Shipment findShipmentOrThrow(Long id) {
        return shipmentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Shipment not found with id: " + id
                ));
    }

    private boolean belongsToBusinessOf(
            Shipment shipment,
            Long userId
    ) {
        if (shipment.getBusinessId() == null) {
            return false;
        }

        return businessAccountRepository.findByUserId(userId)
                .map(account ->
                        account.getId().equals(
                                shipment.getBusinessId()
                        )
                )
                .orElse(false);
    }

    private void logTrackingEvent(
            Long shipmentId,
            Long updatedBy,
            String status,
            String location,
            String notes
    ) {
        trackingEventRepository.save(
                TrackingEvent.builder()
                        .shipmentId(shipmentId)
                        .updatedBy(updatedBy)
                        .status(status)
                        .location(location)
                        .notes(notes)
                        .eventTimestamp(LocalDateTime.now())
                        .build()
        );
    }

    private void sendInAppNotification(
            Long userId,
            Long shipmentId,
            String title,
            String message
    ) {
        try {
            notificationService.notify(
                    userId,
                    shipmentId,
                    title,
                    message,
                    "SHIPMENT_UPDATE"
            );
        } catch (Exception e) {
            log.warn(
                    "Failed to send notification for shipment {}: {}",
                    shipmentId,
                    e.getMessage()
            );
        }
    }

    private void sendShipmentEmail(
            String recipientEmail,
            String subject,
            String message
    ) {
        if (recipientEmail == null || recipientEmail.isBlank()) {
            return;
        }

        try {
            emailService.sendEmail(
                    recipientEmail,
                    subject,
                    message
            );

            log.info(
                    "Shipment email sent to {}",
                    recipientEmail
            );

        } catch (Exception e) {
            log.error(
                    "Failed to send shipment email to {}: {}",
                    recipientEmail,
                    e.getMessage(),
                    e
            );
        }
    }

    private String normalizeRole(String role) {
        if (role == null || role.isBlank()) {
            return "";
        }

        return role
                .replace("ROLE_", "")
                .toUpperCase();
    }

    private String generateTrackingNumber() {
        String candidate;

        do {
            candidate = "STP"
                    + (System.currentTimeMillis() % 1_000_000_000L)
                    + random.nextInt(1000);
        } while (
                shipmentRepository.existsByTrackingNumber(candidate)
        );

        return candidate;
    }

    private ShipmentResponse mapToResponse(Shipment shipment) {
        List<PackageResponse> packages =
                packageRepository.findByShipmentId(shipment.getId())
                        .stream()
                        .map(packageItem ->
                                PackageResponse.builder()
                                        .id(packageItem.getId())
                                        .shipmentId(packageItem.getShipmentId())
                                        .description(packageItem.getDescription())
                                        .weightKg(packageItem.getWeightKg())
                                        .lengthCm(packageItem.getLengthCm())
                                        .widthCm(packageItem.getWidthCm())
                                        .heightCm(packageItem.getHeightCm())
                                        .quantity(packageItem.getQuantity())
                                        .declaredValue(packageItem.getDeclaredValue())
                                        .fragile(packageItem.getFragile())
                                        .build()
                        )
                        .toList();

        return ShipmentResponse.builder()
                .id(shipment.getId())
                .trackingNumber(shipment.getTrackingNumber())
                .createdBy(shipment.getCreatedBy())
                .businessId(shipment.getBusinessId())
                .assignedOperatorId(shipment.getAssignedOperatorId())
                .senderName(shipment.getSenderName())
                .senderPhone(shipment.getSenderPhone())
                .senderAddress(shipment.getSenderAddress())
                .receiverName(shipment.getReceiverName())
                .receiverPhone(shipment.getReceiverPhone())
                .receiverEmail(shipment.getReceiverEmail())
                .receiverAddress(shipment.getReceiverAddress())
                .pickupAddress(shipment.getPickupAddress())
                .deliveryAddress(shipment.getDeliveryAddress())
                .status(shipment.getStatus())
                .priority(shipment.getPriority())
                .estimatedDeliveryDate(shipment.getEstimatedDeliveryDate())
                .actualDeliveryDate(shipment.getActualDeliveryDate())
                .createdAt(shipment.getCreatedAt())
                .updatedAt(shipment.getUpdatedAt())
                .cancelledAt(shipment.getCancelledAt())
                .cancellationReason(shipment.getCancellationReason())
                .packages(packages)
                .build();
    }
}