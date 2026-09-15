package com.shiptrack.shiptrack_pro.repository;

import com.shiptrack.shiptrack_pro.entity.TrackingEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TrackingEventRepository extends JpaRepository<TrackingEvent, Long> {
    
    // This exact naming is required to match your 'eventTimestamp' field
    List<TrackingEvent> findByShipmentIdOrderByEventTimestampDesc(Long shipmentId);
}