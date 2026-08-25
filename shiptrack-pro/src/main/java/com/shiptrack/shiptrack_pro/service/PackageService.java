package com.shiptrack.shiptrack_pro.service;

import com.shiptrack.shiptrack_pro.dto.PackageRequest;
import com.shiptrack.shiptrack_pro.dto.PackageResponse;

import java.util.List;

public interface PackageService {

    PackageResponse createPackage(
            Long shipmentId,
            PackageRequest request,
            String email
    );

    List<PackageResponse> getPackages(
            Long shipmentId,
            String email
    );
}