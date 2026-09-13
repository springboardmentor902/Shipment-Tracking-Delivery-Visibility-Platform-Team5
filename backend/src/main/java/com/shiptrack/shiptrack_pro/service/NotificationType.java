package com.shiptrack.shiptrack_pro.service;

/**
 * The two canonical triggers the Notification Module spec calls out: SHIPMENT_UPDATE for
 * "a new tracking event was added", and DELAY_WARNING for "delay_risk_score crosses the
 * threshold". ETA_UPDATE and DELIVERY_CONFIRMATION are additional ad-hoc types other
 * modules raise via the lower-level NotificationService.notify(...) directly.
 *
 * Only SHIPMENT_UPDATE and DELAY_WARNING go through NotificationService.send(type, user,
 * shipment) - the templated path with duplicate prevention and email/SMS delivery. The
 * others keep using notify(...) with a caller-supplied title/message.
 */
public enum NotificationType {
    SHIPMENT_UPDATE,
    DELAY_WARNING,
    ETA_UPDATE,
    DELIVERY_CONFIRMATION
}
