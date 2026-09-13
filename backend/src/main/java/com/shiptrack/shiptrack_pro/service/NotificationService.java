package com.shiptrack.shiptrack_pro.service;

import com.shiptrack.shiptrack_pro.dto.NotificationResponse;

import java.util.List;

public interface NotificationService {
    /** Creates and "sends" (logs / emails) a notification tied to a shipment event. */
    NotificationResponse notify(Long userId, Long shipmentId, String title, String message, String type);

    /**
     * The templated, two-trigger-type path (SHIPMENT_UPDATE / DELAY_WARNING): builds the
     * title/message from the shipment's own data, applies duplicate prevention (skips
     * creating a new notification if an unread one of the same type already exists for this
     * user+shipment), persists it, emails it (both types), and SMS's it (DELAY_WARNING
     * only). Returns the existing notification instead of a new one when a duplicate is
     * skipped.
     */
    NotificationResponse send(NotificationType type, Long userId, Long shipmentId);

    List<NotificationResponse> getForUser(Long userId);
    NotificationResponse markAsRead(Long notificationId, Long userId);
    long getUnreadCount(Long userId);
}
