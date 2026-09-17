package com.shiptrack.shiptrack_pro.service.impl;

import com.shiptrack.shiptrack_pro.entity.Package;
import com.shiptrack.shiptrack_pro.entity.Shipment;
import com.shiptrack.shiptrack_pro.repository.PackageRepository;
import com.shiptrack.shiptrack_pro.repository.ShipmentRepository;
import com.shiptrack.shiptrack_pro.service.PackageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PackageServiceImpl implements PackageService {

    private final PackageRepository packageRepository;
    private final ShipmentRepository shipmentRepository;

    @Override
    @Transactional
    public Package createPackage(
            Long shipmentId,
            Package packageEntity) {

        Shipment shipment =
                shipmentRepository.findById(shipmentId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Shipment not found"
                                )
                        );

        packageEntity.setId(null);
        packageEntity.setShipment(shipment);

        return packageRepository.save(packageEntity);
    }

    @Override
    public List<Package> getPackagesByShipment(
            Long shipmentId) {

        return packageRepository
                .findByShipmentId(shipmentId);
    }

    @Override
    public Package getPackageById(Long id) {

        return packageRepository.findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Package not found"
                        )
                );
    }

    @Override
    @Transactional
    public Package updatePackage(
            Long id,
            Package packageEntity) {

        Package existing =
                getPackageById(id);

        existing.setPackageDescription(
                packageEntity.getPackageDescription()
        );

        existing.setWeight(
                packageEntity.getWeight()
        );

        existing.setDimensions(
                packageEntity.getDimensions()
        );

        existing.setQuantity(
                packageEntity.getQuantity()
        );

        existing.setDeclaredValue(
                packageEntity.getDeclaredValue()
        );

        existing.setFragile(
                packageEntity.getFragile()
        );

        return packageRepository.save(existing);
    }

    @Override
    @Transactional
    public void deletePackage(Long id) {

        Package packageEntity =
                getPackageById(id);

        packageRepository.delete(packageEntity);
    }
}