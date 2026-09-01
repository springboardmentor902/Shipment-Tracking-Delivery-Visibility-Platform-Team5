package com.shiptrack.shiptrack_pro.service;

import com.shiptrack.shiptrack_pro.entity.Notification;

import java.util.List;

public interface NotificationService {

    Notification createNotification(
            Long userId,
            Long shipmentId,
            String title,
            String message,
            String type
    );

    List<Notification> getNotifications(Long userId);

    Notification markAsRead(Long notificationId, Long userId);
}