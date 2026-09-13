package com.shiptrack.shiptrack_pro.repository;

import com.shiptrack.shiptrack_pro.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Notification> findByShipmentId(Long shipmentId);
    long countByUserIdAndStatusNot(Long userId, String status);

    /**
     * Duplicate prevention: has a notification of this exact type already been sent for
     * this user+shipment within the recent window (createdAt after the given cutoff)?
     * Used by NotificationService.send(...) so, e.g., a shipment stuck above the
     * delay-risk threshold across several scheduled recalculations doesn't spam the same
     * DELAY_WARNING notification (and its email/SMS) repeatedly within a short span.
     */
    Optional<Notification> findFirstByUserIdAndShipmentIdAndTypeAndCreatedAtAfterOrderByCreatedAtDesc(
            Long userId, Long shipmentId, String type, LocalDateTime cutoff);
}
