package com.shiptrack.shiptrack_pro.repository;

import com.shiptrack.shiptrack_pro.entity.PackageItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PackageItemRepository extends JpaRepository<PackageItem, Long> {
    List<PackageItem> findByShipmentId(Long shipmentId);
    void deleteByShipmentId(Long shipmentId);
}
