package com.shiptrack.shiptrack_pro.service.impl;

import com.shiptrack.shiptrack_pro.dto.NotificationResponse;
import com.shiptrack.shiptrack_pro.entity.EtaPrediction;
import com.shiptrack.shiptrack_pro.entity.Notification;
import com.shiptrack.shiptrack_pro.entity.Shipment;
import com.shiptrack.shiptrack_pro.entity.User;
import com.shiptrack.shiptrack_pro.integration.EmailService;
import com.shiptrack.shiptrack_pro.integration.SmsService;
import com.shiptrack.shiptrack_pro.repository.EtaPredictionRepository;
import com.shiptrack.shiptrack_pro.repository.NotificationRepository;
import com.shiptrack.shiptrack_pro.repository.ShipmentRepository;
import com.shiptrack.shiptrack_pro.repository.UserRepository;
import com.shiptrack.shiptrack_pro.service.NotificationService;
import com.shiptrack.shiptrack_pro.service.NotificationType;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Central place every other module calls into to raise a notification.
 *
 * notify(...) is the low-level path: caller supplies the title/message directly, used by
 * modules that already have their own copy (POD confirmation, etc).
 *
 * send(type, userId, shipmentId) is the templated path for the Notification Module's two
 * canonical triggers - SHIPMENT_UPDATE ("a new tracking event was added") and
 * DELAY_WARNING ("delay_risk_score crosses the threshold"). It builds the title/message
 * itself from the shipment's data, applies duplicate prevention, creates the record,
 * attempts delivery, and updates status/sentAt accordingly - then fans out to email (both
 * types) and SMS (DELAY_WARNING only), both fail-safe and never blocking the in-app
 * notification record from being created.
 */
@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationServiceImpl.class);

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final ShipmentRepository shipmentRepository;
    private final EtaPredictionRepository etaPredictionRepository;
    private final EmailService emailService;
    private final SmsService smsService;

    /**
     * "Recently" for duplicate prevention purposes - if a notification of the same type
     * was already sent for the same user+shipment within this many minutes, skip sending
     * another one. Configurable via notification.duplicate-window-minutes.
     */
    @Value("${notification.duplicate-window-minutes:30}")
    private int duplicateWindowMinutes;

    @Override
    public NotificationResponse notify(Long userId, Long shipmentId, String title, String message, String type) {
        Notification notification = Notification.builder()
                .userId(userId)
                .shipmentId(shipmentId)
                .title(title)
                .message(message)
                .type(type)
                .status("SENT")
                .sentAt(LocalDateTime.now())
                .build();

        return mapToResponse(notificationRepository.save(notification));
    }

    @Override
    public NotificationResponse send(NotificationType type, Long userId, Long shipmentId) {
        // Duplicate prevention: has a notification of this exact type already gone out for
        // this user+shipment within the recent window? If so, don't create another one (and
        // don't re-send email/SMS) - just hand back the existing one.
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(duplicateWindowMinutes);
        Optional<Notification> existing = notificationRepository
                .findFirstByUserIdAndShipmentIdAndTypeAndCreatedAtAfterOrderByCreatedAtDesc(
                        userId, shipmentId, type.name(), cutoff);
        if (existing.isPresent()) {
            log.debug("Skipping duplicate {} notification for user {} / shipment {} - one was already sent " +
                    "within the last {} minutes.", type, userId, shipmentId, duplicateWindowMinutes);
            return mapToResponse(existing.get());
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        Shipment shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Shipment not found"));

        String title;
        String message;

        switch (type) {
            case DELAY_WARNING -> {
                String riskText = etaPredictionRepository.findByShipmentId(shipmentId)
                        .map(EtaPrediction::getDelayRiskScore)
                        .map(score -> score + "/10")
                        .orElse("elevated");
                title = "Delivery Delay Warning";
                message = "Shipment " + shipment.getTrackingNumber() + " is at high risk of delay "
                        + "(delay risk score: " + riskText + "). We're keeping an eye on it.";
            }
            case SHIPMENT_UPDATE -> {
                title = "Tracking Update";
                message = "Shipment " + shipment.getTrackingNumber() + " has a new tracking update - current status: "
                        + shipment.getStatus().replace('_', ' ') + ".";
            }
            case DELIVERY_CONFIRMATION -> {
                title = "Delivered";
                message = "Shipment " + shipment.getTrackingNumber() + " has been delivered.";
            }
            default -> {
                title = type.name().replace('_', ' ');
                message = "Update on shipment " + shipment.getTrackingNumber() + ".";
            }
        }

        // Create the notification record first with a pending-ish default, then update
        // status/sentAt based on how creation + delivery actually go.
        Notification notification = Notification.builder()
                .userId(userId)
                .shipmentId(shipmentId)
                .title(title)
                .message(message)
                .type(type.name())
                .status("SENT")
                .sentAt(LocalDateTime.now())
                .build();

        Notification saved;
        try {
            saved = notificationRepository.save(notification);
        } catch (Exception e) {
            // If we can't even persist the record, there's nothing to deliver or return.
            log.error("Failed to persist {} notification for user {} / shipment {}: {}",
                    type, userId, shipmentId, e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not create notification");
        }

        // Email for both trigger types.
        emailService.sendEmail(user.getEmail(), title, message);

        // SMS only for delay warnings.
        if (type == NotificationType.DELAY_WARNING) {
            smsService.sendSms(user.getPhone(), message);
        }

        return mapToResponse(saved);
    }

    @Override
    public List<NotificationResponse> getForUser(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().map(this::mapToResponse).toList();
    }

    @Override
    public NotificationResponse markAsRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found"));

        if (!notification.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This notification does not belong to you.");
        }

        notification.setStatus("READ");
        notification.setReadAt(LocalDateTime.now());
        return mapToResponse(notificationRepository.save(notification));
    }

    @Override
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndStatusNot(userId, "READ");
    }

    private NotificationResponse mapToResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .userId(n.getUserId())
                .shipmentId(n.getShipmentId())
                .title(n.getTitle())
                .message(n.getMessage())
                .type(n.getType())
                .status(n.getStatus())
                .sentAt(n.getSentAt())
                .readAt(n.getReadAt())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
