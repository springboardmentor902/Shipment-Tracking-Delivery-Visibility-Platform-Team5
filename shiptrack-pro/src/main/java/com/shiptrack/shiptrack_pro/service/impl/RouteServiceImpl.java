package com.shiptrack.shiptrack_pro.service.impl;

import com.shiptrack.shiptrack_pro.dto.RouteAlternative;
import com.shiptrack.shiptrack_pro.entity.Route;
import com.shiptrack.shiptrack_pro.entity.Shipment;
import com.shiptrack.shiptrack_pro.entity.User;
import com.shiptrack.shiptrack_pro.repository.RouteRepository;
import com.shiptrack.shiptrack_pro.repository.ShipmentRepository;
import com.shiptrack.shiptrack_pro.repository.UserRepository;
import com.shiptrack.shiptrack_pro.service.RouteOptimizationService;
import com.shiptrack.shiptrack_pro.service.RouteService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

@Service
public class RouteServiceImpl implements RouteService {

    private final RouteRepository routeRepository;
    private final ShipmentRepository shipmentRepository;
    private final UserRepository userRepository;
    private final RouteOptimizationService routeOptimizationService;

    public RouteServiceImpl(
            RouteRepository routeRepository,
            ShipmentRepository shipmentRepository,
            UserRepository userRepository,
            RouteOptimizationService routeOptimizationService) {

        this.routeRepository = routeRepository;
        this.shipmentRepository = shipmentRepository;
        this.userRepository = userRepository;
        this.routeOptimizationService = routeOptimizationService;
    }

    @Override
    public Route createRoute(
            Route route,
            String email) {

        User user = getUser(email);

        requireRouteManager(user);

        if (route.getShipmentId() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Shipment ID is required"
            );
        }

        Shipment shipment = getShipment(route.getShipmentId());

        if (isBlank(route.getOrigin())
                || isBlank(route.getDestination())) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Origin and destination are required"
            );
        }

        RouteAlternative optimizedRoute =
                routeOptimizationService.selectBestRoute(
                        route.getOrigin(),
                        route.getDestination()
                );

        markPreviousRouteAsNotCurrent(
                route.getShipmentId()
        );

        route.setId(null);

        // Link route with the shipment's assigned logistics operator
        if (route.getDriverId() == null) {
            route.setDriverId(
                    shipment.getAssignedOperatorId()
            );
        }

        route.setDistanceKm(
                optimizedRoute.getDistanceKm()
        );

        route.setEstimatedTimeMinutes(
                optimizedRoute.getTrafficAdjustedDurationMinutes()
        );

        route.setTrafficCondition(
                optimizedRoute.getSelectionReason()
        );

        route.setIsCurrent(true);

        return routeRepository.save(route);
    }

    @Override
    public Route createRouteFromShipment(
            Shipment shipment) {

        if (shipment.getId() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Shipment must be saved before creating route"
            );
        }

        if (isBlank(shipment.getPickupAddress())
                || isBlank(shipment.getDeliveryAddress())) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Pickup and delivery addresses are required"
            );
        }

        RouteAlternative optimizedRoute =
                routeOptimizationService.selectBestRoute(
                        shipment.getPickupAddress(),
                        shipment.getDeliveryAddress()
                );

        markPreviousRouteAsNotCurrent(
                shipment.getId()
        );

        Route route = new Route();

        route.setShipmentId(
                shipment.getId()
        );

        // Link the assigned logistics operator as driver
        route.setDriverId(
                shipment.getAssignedOperatorId()
        );

        route.setOrigin(
                shipment.getPickupAddress()
        );

        route.setDestination(
                shipment.getDeliveryAddress()
        );

        route.setDistanceKm(
                optimizedRoute.getDistanceKm()
        );

        route.setEstimatedTimeMinutes(
                optimizedRoute
                        .getTrafficAdjustedDurationMinutes()
        );

        route.setTrafficCondition(
                optimizedRoute.getSelectionReason()
        );

        route.setIsCurrent(true);

        return routeRepository.save(route);
    }

    @Override
    public List<Route> getRoutesByShipmentId(
            Long shipmentId,
            String email) {

        User user = getUser(email);

        Shipment shipment =
                getShipment(shipmentId);

        checkViewAccess(
                user,
                shipment
        );

        Route currentRoute =
                routeRepository
                        .findByShipmentIdAndIsCurrentTrue(
                                shipmentId
                        )
                        .orElse(null);

        if (currentRoute == null) {
            return List.of();
        }

        return List.of(currentRoute);
    }

    @Override
    public List<Route> getRouteHistory(
            Long shipmentId,
            String email) {

        User user = getUser(email);

        Shipment shipment =
                getShipment(shipmentId);

        checkViewAccess(
                user,
                shipment
        );

        return routeRepository
                .findAllByShipmentIdOrderByCreatedAtDesc(
                        shipmentId
                );
    }

    @Override
    public Route updateRoute(
            Long routeId,
            Route updatedRoute,
            String email) {

        User user = getUser(email);

        requireRouteManager(user);

        Route existingRoute =
                routeRepository.findById(routeId)
                        .orElseThrow(
                                () -> new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Route not found"
                                )
                        );

        if (updatedRoute.getShipmentId() != null
                && !Objects.equals(
                        existingRoute.getShipmentId(),
                        updatedRoute.getShipmentId())) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Shipment cannot be changed"
            );
        }

        boolean locationChanged = false;

        if (!isBlank(updatedRoute.getOrigin())
                && !Objects.equals(
                        existingRoute.getOrigin(),
                        updatedRoute.getOrigin())) {

            existingRoute.setOrigin(
                    updatedRoute.getOrigin()
            );

            locationChanged = true;
        }

        if (!isBlank(updatedRoute.getDestination())
                && !Objects.equals(
                        existingRoute.getDestination(),
                        updatedRoute.getDestination())) {

            existingRoute.setDestination(
                    updatedRoute.getDestination()
            );

            locationChanged = true;
        }

        if (updatedRoute.getDriverId() != null) {
            existingRoute.setDriverId(
                    updatedRoute.getDriverId()
            );
        }

        if (updatedRoute.getWaypoints() != null) {
            existingRoute.setWaypoints(
                    updatedRoute.getWaypoints()
            );
        }

        if (updatedRoute.getTrafficCondition() != null) {
            existingRoute.setTrafficCondition(
                    updatedRoute.getTrafficCondition()
            );
        }

        if (updatedRoute.getActualTimeMinutes() != null) {
            existingRoute.setActualTimeMinutes(
                    updatedRoute.getActualTimeMinutes()
            );
        }

        if (locationChanged
                || existingRoute.getDistanceKm() == null
                || existingRoute.getEstimatedTimeMinutes() == null) {

            RouteAlternative optimizedRoute =
                    routeOptimizationService.selectBestRoute(
                            existingRoute.getOrigin(),
                            existingRoute.getDestination()
                    );

            existingRoute.setDistanceKm(
                    optimizedRoute.getDistanceKm()
            );

            existingRoute.setEstimatedTimeMinutes(
                    optimizedRoute.getTrafficAdjustedDurationMinutes()
            );

            existingRoute.setTrafficCondition(
                    optimizedRoute.getSelectionReason()
            );
        }

        return routeRepository.save(existingRoute);
    }

    /**
     * Updates the latest driver location for a route.
     * Only the logistics operator assigned to the shipment
     * can update its live location.
     */
    @Override
    public Route updateDriverLocation(
            Long routeId,
            BigDecimal latitude,
            BigDecimal longitude,
            String location,
            String email) {

        User user = getUser(email);

        Route route = routeRepository.findById(routeId)
                .orElseThrow(
                        () -> new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Route not found"
                        )
                );

        Shipment shipment =
                getShipment(route.getShipmentId());

        // Only the assigned logistics operator
        // can update driver location
        if (!hasRole(user, "LOGISTICS_OPERATOR")
                || !Objects.equals(
                        shipment.getAssignedOperatorId(),
                        user.getId())) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Only the assigned logistics operator can update driver location"
            );
        }

        if (latitude == null || longitude == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Latitude and longitude are required"
            );
        }

        if (latitude.compareTo(
                new BigDecimal("-90")) < 0
                || latitude.compareTo(
                new BigDecimal("90")) > 0) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid latitude"
            );
        }

        if (longitude.compareTo(
                new BigDecimal("-180")) < 0
                || longitude.compareTo(
                new BigDecimal("180")) > 0) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid longitude"
            );
        }

        route.setLastLatitude(latitude);
        route.setLastLongitude(longitude);
        route.setLastLocation(location);
        route.setLastLocationAt(
                LocalDateTime.now()
        );

        return routeRepository.save(route);
    }

    private void markPreviousRouteAsNotCurrent(
            Long shipmentId) {

        routeRepository
                .findByShipmentIdAndIsCurrentTrue(
                        shipmentId
                )
                .ifPresent(currentRoute -> {

                    currentRoute.setIsCurrent(false);

                    routeRepository.save(currentRoute);
                });
    }

    private User getUser(String email) {

        return userRepository.findByEmail(email)
                .orElseThrow(
                        () -> new ResponseStatusException(
                                HttpStatus.UNAUTHORIZED,
                                "User not found"
                        )
                );
    }

    private Shipment getShipment(
            Long shipmentId) {

        return shipmentRepository.findById(shipmentId)
                .orElseThrow(
                        () -> new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Shipment not found"
                        )
                );
    }

    private void requireRouteManager(
            User user) {

        if (!hasRole(
                user,
                "LOGISTICS_OPERATOR"
        )
                && !hasRole(
                user,
                "ADMINISTRATOR"
        )) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Only operator or admin can manage routes"
            );
        }
    }

    private void checkViewAccess(
            User user,
            Shipment shipment) {

        if (hasRole(
                user,
                "ADMINISTRATOR"
        )) {
            return;
        }

        if (hasRole(
                user,
                "SUPPORT_AGENT"
        )) {
            return;
        }

        if (hasRole(
                user,
                "LOGISTICS_OPERATOR"
        )) {
            return;
        }

        if (hasRole(
                user,
                "CUSTOMER"
        )
                && Objects.equals(
                shipment.getCreatedBy(),
                user.getId())) {
            return;
        }

        if (hasRole(
                user,
                "BUSINESS_CLIENT"
        )
                && Objects.equals(
                shipment.getCreatedBy(),
                user.getId())) {
            return;
        }

        throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "You cannot view this shipment route"
        );
    }

    private boolean hasRole(
            User user,
            String role) {

        return user.getRole() != null
                && role.equalsIgnoreCase(
                user.getRole()
        );
    }

    private boolean isBlank(
            String value) {

        return value == null
                || value.trim().isEmpty();
    }
}