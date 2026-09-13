package com.shiptrack.shiptrack_pro.controller;

import com.shiptrack.shiptrack_pro.dto.NotificationResponse;
import com.shiptrack.shiptrack_pro.security.CurrentUser;
import com.shiptrack.shiptrack_pro.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** Notification Module (PDF 4.9) - the in-app notification center for the current user. */
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final CurrentUser currentUser;

    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getMine() {
        return ResponseEntity.ok(notificationService.getForUser(currentUser.id()));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> unreadCount() {
        return ResponseEntity.ok(Map.of("unread", notificationService.getUnreadCount(currentUser.id())));
    }

    /** Spec asks for PATCH specifically; PUT is kept as a separate mapping for backward compatibility. */
    @PutMapping("/{id}/read")
    public ResponseEntity<NotificationResponse> markAsReadPut(@PathVariable Long id) {
        return markAsRead(id);
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<NotificationResponse> markAsReadPatch(@PathVariable Long id) {
        return markAsRead(id);
    }

    private ResponseEntity<NotificationResponse> markAsRead(Long id) {
        return ResponseEntity.ok(notificationService.markAsRead(id, currentUser.id()));
    }
}
