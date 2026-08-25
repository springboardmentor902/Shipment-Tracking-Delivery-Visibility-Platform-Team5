package com.shiptrack.shiptrack_pro.repository;

import com.shiptrack.shiptrack_pro.entity.EtaPrediction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EtaPredictionRepository extends JpaRepository<EtaPrediction, Long> {

    Optional<EtaPrediction> findByShipmentId(Long shipmentId);
}