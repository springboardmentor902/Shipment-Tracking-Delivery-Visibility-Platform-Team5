package com.shiptrack.shiptrack_pro.controller;

import com.shiptrack.shiptrack_pro.dto.PackageRequest;
import com.shiptrack.shiptrack_pro.dto.PackageResponse;
import com.shiptrack.shiptrack_pro.service.PackageService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/shipments/{shipmentId}/packages")
@RequiredArgsConstructor
public class PackageController {

    private final PackageService packageService;

    @PostMapping
    public ResponseEntity<PackageResponse> createPackage(
            @PathVariable Long shipmentId,
            @RequestBody PackageRequest request,
            Authentication authentication) {

        return ResponseEntity.ok(
                packageService.createPackage(
                        shipmentId,
                        request,
                        authentication.getName()
                )
        );
    }

    @GetMapping
    public ResponseEntity<List<PackageResponse>> getPackages(
            @PathVariable Long shipmentId,
            Authentication authentication) {

        return ResponseEntity.ok(
                packageService.getPackages(
                        shipmentId,
                        authentication.getName()
                )
        );
    }
}