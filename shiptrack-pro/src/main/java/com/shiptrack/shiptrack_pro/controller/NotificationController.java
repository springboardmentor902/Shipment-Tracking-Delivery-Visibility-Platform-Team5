package com.shiptrack.shiptrack_pro.controller;

import com.shiptrack.shiptrack_pro.entity.Notification;
import com.shiptrack.shiptrack_pro.service.NotificationService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    /*
     * ============================================================
     * EXISTING FRONTEND ENDPOINTS
     * ============================================================
     */

    @GetMapping("/api/notifications")
    public ResponseEntity<List<Notification>> getNotifications(
            @RequestParam Long userId) {

        return ResponseEntity.ok(
                notificationService.getNotifications(userId)
        );
    }

    @PatchMapping("/api/notifications/{id}/read")
    public ResponseEntity<Notification> markAsRead(
            @PathVariable Long id,
            @RequestParam Long userId) {

        return ResponseEntity.ok(
                notificationService.markAsRead(id, userId)
        );
    }

    /*
     * ============================================================
     * MENTOR REQUIRED ENDPOINT
     * ============================================================
     *
     * POST /api/notification
     *
     * This is kept in addition to the existing plural endpoint
     * so the current frontend does not break.
     */

    @PostMapping("/api/notification")
    public ResponseEntity<Notification> createNotification(
            @RequestParam Long userId,
            @RequestParam Long shipmentId,
            @RequestParam String title,
            @RequestParam String message,
            @RequestParam String type) {

        return ResponseEntity.ok(
                notificationService.createNotification(
                        userId,
                        shipmentId,
                        title,
                        message,
                        type
                )
        );
    }

    /*
     * ============================================================
     * OPTIONAL BACKWARD-COMPATIBLE ENDPOINT
     * ============================================================
     *
     * Your previous implementation used:
     *
     * POST /api/notifications
     *
     * Keep it so nothing that already uses the old endpoint breaks.
     */

    @PostMapping("/api/notifications")
    public ResponseEntity<Notification> createNotificationPlural(
            @RequestParam Long userId,
            @RequestParam Long shipmentId,
            @RequestParam String title,
            @RequestParam String message,
            @RequestParam String type) {

        return ResponseEntity.ok(
                notificationService.createNotification(
                        userId,
                        shipmentId,
                        title,
                        message,
                        type
                )
        );
    }
}