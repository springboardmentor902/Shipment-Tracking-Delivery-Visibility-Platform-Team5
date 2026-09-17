package com.shiptrack.shiptrack_pro.controller;

import com.shiptrack.shiptrack_pro.entity.Package;
import com.shiptrack.shiptrack_pro.service.PackageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/packages")
@RequiredArgsConstructor
public class PackageController {

    private final PackageService packageService;

    @PostMapping("/shipment/{shipmentId}")
    public ResponseEntity<Package> createPackage(
            @PathVariable Long shipmentId,
            @RequestBody Package packageEntity) {

        Package created =
                packageService.createPackage(
                        shipmentId,
                        packageEntity
                );

        return new ResponseEntity<>(
                created,
                HttpStatus.CREATED
        );
    }

    @GetMapping("/shipment/{shipmentId}")
    public ResponseEntity<List<Package>> getPackages(
            @PathVariable Long shipmentId) {

        return ResponseEntity.ok(
                packageService.getPackagesByShipment(
                        shipmentId
                )
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<Package> getPackage(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                packageService.getPackageById(id)
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<Package> updatePackage(
            @PathVariable Long id,
            @RequestBody Package packageEntity) {

        return ResponseEntity.ok(
                packageService.updatePackage(
                        id,
                        packageEntity
                )
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePackage(
            @PathVariable Long id) {

        packageService.deletePackage(id);

        return ResponseEntity.noContent().build();
    }
}