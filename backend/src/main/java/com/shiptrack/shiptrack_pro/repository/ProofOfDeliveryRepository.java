package com.shiptrack.shiptrack_pro.repository;

import com.shiptrack.shiptrack_pro.entity.ProofOfDelivery;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProofOfDeliveryRepository extends JpaRepository<ProofOfDelivery, Long> {
    Optional<ProofOfDelivery> findByShipmentId(Long shipmentId);
    boolean existsByShipmentId(Long shipmentId);

    /** The verification queue - proofs an Admin/Support Agent hasn't verified yet, oldest first. */
    List<ProofOfDelivery> findByVerificationStatusOrderByDeliveredAtAsc(String verificationStatus);

    long countByVerificationStatus(String verificationStatus);
}
