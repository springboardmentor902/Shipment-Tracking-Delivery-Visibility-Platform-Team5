package com.shiptrack.shiptrack_pro.service;

import com.shiptrack.shiptrack_pro.entity.Package;

import java.util.List;

public interface PackageService {

    Package createPackage(Long shipmentId, Package packageEntity);

    List<Package> getPackagesByShipment(Long shipmentId);

    Package getPackageById(Long id);

    Package updatePackage(Long id, Package packageEntity);

    void deletePackage(Long id);
}