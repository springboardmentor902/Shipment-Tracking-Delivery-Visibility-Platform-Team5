package com.shiptrack.shiptrack_pro.controller;

import com.shiptrack.shiptrack_pro.dto.NotificationResponse;
import com.shiptrack.shiptrack_pro.dto.SendNotificationRequest;
import com.shiptrack.shiptrack_pro.service.NotificationService;
import com.shiptrack.shiptrack_pro.service.NotificationType;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.Arrays;

/**
 * Deliberately a separate controller at the singular /api/notification path (distinct from
 * NotificationController's /api/notifications), matching the endpoint exactly as specified.
 * Lets staff manually trigger a notification for a user about a shipment - e.g. a Support
 * Agent proactively notifying a customer outside the two automatic triggers.
 */
@RestController
@RequestMapping("/api/notification")
@RequiredArgsConstructor
public class SendNotificationController {

    private final NotificationService notificationService;

    @PostMapping
    public ResponseEntity<NotificationResponse> send(@Valid @RequestBody SendNotificationRequest request) {
        NotificationType type;
        try {
            type = NotificationType.valueOf(request.getType().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Invalid type: " + request.getType() + ". Must be one of: " + Arrays.toString(NotificationType.values()));
        }

        NotificationResponse response = notificationService.send(type, request.getUserId(), request.getShipmentId());
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }
}
