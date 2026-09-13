package com.shiptrack.shiptrack_pro.repository;

import com.shiptrack.shiptrack_pro.entity.Shipment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ShipmentRepository extends JpaRepository<Shipment, Long> {
    Optional<Shipment> findByTrackingNumber(String trackingNumber);
    boolean existsByTrackingNumber(String trackingNumber);
    List<Shipment> findByCreatedBy(Long createdBy);
    List<Shipment> findByBusinessId(Long businessId);
    List<Shipment> findByAssignedOperatorId(Long assignedOperatorId);
    List<Shipment> findByStatus(String status);
    long countByStatus(String status);
    long countByBusinessId(Long businessId);

    /** Used by the scheduled ETA recalculation job to find in-progress shipments. */
    List<Shipment> findByStatusNotIn(Collection<String> statuses);
}
