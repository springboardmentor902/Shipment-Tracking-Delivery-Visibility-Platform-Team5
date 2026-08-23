package com.shiptrack.shiptrack_pro.service.impl;

import com.shiptrack.shiptrack_pro.dto.PackageRequest;
import com.shiptrack.shiptrack_pro.dto.PackageResponse;
import com.shiptrack.shiptrack_pro.entity.Package;
import com.shiptrack.shiptrack_pro.entity.Shipment;
import com.shiptrack.shiptrack_pro.entity.User;
import com.shiptrack.shiptrack_pro.repository.PackageRepository;
import com.shiptrack.shiptrack_pro.repository.ShipmentRepository;
import com.shiptrack.shiptrack_pro.repository.UserRepository;
import com.shiptrack.shiptrack_pro.service.PackageService;

import lombok.RequiredArgsConstructor;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PackageServiceImpl implements PackageService {

    private final PackageRepository packageRepository;
    private final ShipmentRepository shipmentRepository;
    private final UserRepository userRepository;

    @Override
    public PackageResponse createPackage(
            Long shipmentId,
            PackageRequest request,
            String email) {

        Shipment shipment = getVisibleShipment(shipmentId, email);

        Package packageEntity = Package.builder()
                .shipment(shipment)
                .weight(request.getWeight())
                .dimensions(request.getDimensions())
                .quantity(request.getQuantity())
                .declaredValue(request.getDeclaredValue())
                .fragile(request.getFragile())
                .description(request.getDescription())
                .build();

        return toResponse(
                packageRepository.save(packageEntity)
        );
    }

    @Override
    public List<PackageResponse> getPackages(
            Long shipmentId,
            String email) {

        getVisibleShipment(shipmentId, email);

        return packageRepository
                .findByShipmentId(shipmentId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private Shipment getVisibleShipment(
            Long shipmentId,
            String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        Shipment shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() ->
                        new RuntimeException("Shipment not found"));

        String role = user.getRole().toUpperCase();

        boolean allowed =
                role.equals("ADMINISTRATOR")
                || role.equals("SUPPORT_AGENT")
                || ((role.equals("CUSTOMER")
                    || role.equals("BUSINESS_CLIENT"))
                    && user.getId().equals(
                            shipment.getCreatedBy()))
                || (role.equals("LOGISTICS_OPERATOR")
                    && user.getId().equals(
                            shipment.getAssignedOperatorId()));

        if (!allowed) {
            throw new AccessDeniedException(
                    "You cannot access this shipment"
            );
        }

        return shipment;
    }

    private PackageResponse toResponse(Package packageEntity) {

        return PackageResponse.builder()
                .id(packageEntity.getId())
                .shipmentId(
                        packageEntity.getShipment().getId()
                )
                .weight(packageEntity.getWeight())
                .dimensions(packageEntity.getDimensions())
                .quantity(packageEntity.getQuantity())
                .declaredValue(packageEntity.getDeclaredValue())
                .fragile(packageEntity.getFragile())
                .description(packageEntity.getDescription())
                .build();
    }
}