package com.shiptrack.shiptrack_pro.repository;

import com.shiptrack.shiptrack_pro.entity.Route;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RouteRepository extends JpaRepository<Route, Long> {
    List<Route> findByShipmentId(Long shipmentId);
    List<Route> findByDriverId(Long driverId);
    Optional<Route> findFirstByShipmentIdOrderByCreatedAtDesc(Long shipmentId);

    /** Route history, oldest first - so the frontend can render it as a timeline. */
    List<Route> findByShipmentIdOrderByCreatedAtAsc(Long shipmentId);

    /** The one route currently marked active for a shipment (should be at most one). */
    Optional<Route> findByShipmentIdAndIsCurrentTrue(Long shipmentId);

    /** Used when re-routing: flips every other route on this shipment to isCurrent=false. */
    List<Route> findByShipmentIdAndIsCurrentTrueAndIdNot(Long shipmentId, Long excludingRouteId);
}
