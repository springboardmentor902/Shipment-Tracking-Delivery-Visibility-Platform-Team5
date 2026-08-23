package com.shiptrack.shiptrack_pro.repository;

import com.shiptrack.shiptrack_pro.entity.Package;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PackageRepository
        extends JpaRepository<Package, Long> {

    List<Package> findByShipmentId(Long shipmentId);
}