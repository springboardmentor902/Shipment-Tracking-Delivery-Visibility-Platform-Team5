package com.shiptrack.shiptrack_pro.service.impl;

import com.shiptrack.shiptrack_pro.entity.Route;
import com.shiptrack.shiptrack_pro.entity.Shipment;
import com.shiptrack.shiptrack_pro.entity.User;
import com.shiptrack.shiptrack_pro.repository.RouteRepository;
import com.shiptrack.shiptrack_pro.repository.ShipmentRepository;
import com.shiptrack.shiptrack_pro.repository.UserRepository;
import com.shiptrack.shiptrack_pro.service.GoogleMapsService;
import com.shiptrack.shiptrack_pro.service.RouteService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Objects;

@Service
public class RouteServiceImpl implements RouteService {

    private final RouteRepository routeRepository;
    private final ShipmentRepository shipmentRepository;
    private final UserRepository userRepository;
    private final GoogleMapsService googleMapsService;

    public RouteServiceImpl(
            RouteRepository routeRepository,
            ShipmentRepository shipmentRepository,
            UserRepository userRepository,
            GoogleMapsService googleMapsService) {

        this.routeRepository = routeRepository;
        this.shipmentRepository = shipmentRepository;
        this.userRepository = userRepository;
        this.googleMapsService = googleMapsService;
    }

    @Override
    public Route createRoute(Route route, String email) {

        User user = getUser(email);
        requireRouteManager(user);

        if (route.getShipmentId() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Shipment ID is required"
            );
        }

        getShipment(route.getShipmentId());

        if (isBlank(route.getOrigin())
                || isBlank(route.getDestination())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Origin and destination are required"
            );
        }

        GoogleMapsService.RouteDetails details =
                googleMapsService.calculateRoute(
                        route.getOrigin(),
                        route.getDestination()
                );

        route.setId(null);
        route.setDistanceKm(details.distanceKm());
        route.setEstimatedTimeMinutes(
                details.estimatedTimeMinutes()
        );

        return routeRepository.save(route);
    }

    @Override
    public List<Route> getRoutesByShipmentId(
            Long shipmentId,
            String email) {

        User user = getUser(email);
        Shipment shipment = getShipment(shipmentId);

        checkViewAccess(user, shipment);

        return routeRepository
                .findAllByShipmentIdOrderByCreatedAtDesc(shipmentId);
    }

    @Override
    public Route updateRoute(
            Long routeId,
            Route updatedRoute,
            String email) {

        User user = getUser(email);
        requireRouteManager(user);

        Route existingRoute = routeRepository.findById(routeId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Route not found"
                ));

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

            existingRoute.setOrigin(updatedRoute.getOrigin());
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

        if (locationChanged) {
            GoogleMapsService.RouteDetails details =
                    googleMapsService.calculateRoute(
                            existingRoute.getOrigin(),
                            existingRoute.getDestination()
                    );

            existingRoute.setDistanceKm(details.distanceKm());
            existingRoute.setEstimatedTimeMinutes(
                    details.estimatedTimeMinutes()
            );
        }

        return routeRepository.save(existingRoute);
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "User not found"
                ));
    }

    private Shipment getShipment(Long shipmentId) {
        return shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Shipment not found"
                ));
    }

    private void requireRouteManager(User user) {
        if (!hasRole(user, "LOGISTICS_OPERATOR")
                && !hasRole(user, "ADMINISTRATOR")) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Only operator or admin can manage routes"
            );
        }
    }

    private void checkViewAccess(User user, Shipment shipment) {

        if (hasRole(user, "ADMINISTRATOR")
                || hasRole(user, "SUPPORT_AGENT")) {
            return;
        }

        if ((hasRole(user, "CUSTOMER")
                || hasRole(user, "BUSINESS_CLIENT"))
                && Objects.equals(
                        shipment.getCreatedBy(),
                        user.getId())) {
            return;
        }

        if (hasRole(user, "LOGISTICS_OPERATOR")
                && Objects.equals(
                        shipment.getAssignedOperatorId(),
                        user.getId())) {
            return;
        }

        throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "You cannot view this shipment route"
        );
    }

    private boolean hasRole(User user, String role) {
        return user.getRole() != null
                && role.equalsIgnoreCase(user.getRole());
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}