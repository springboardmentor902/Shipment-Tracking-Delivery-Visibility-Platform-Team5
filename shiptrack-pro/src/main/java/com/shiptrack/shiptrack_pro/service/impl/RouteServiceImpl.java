package com.shiptrack.shiptrack_pro.service.impl;

import com.shiptrack.shiptrack_pro.dto.RouteRequest;
import com.shiptrack.shiptrack_pro.dto.RouteResponse;
import com.shiptrack.shiptrack_pro.entity.Route;
import com.shiptrack.shiptrack_pro.entity.Shipment;
import com.shiptrack.shiptrack_pro.entity.User;
import com.shiptrack.shiptrack_pro.repository.RouteRepository;
import com.shiptrack.shiptrack_pro.repository.ShipmentRepository;
import com.shiptrack.shiptrack_pro.repository.UserRepository;
import com.shiptrack.shiptrack_pro.service.OpenRouteService;
import com.shiptrack.shiptrack_pro.service.RouteService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class RouteServiceImpl implements RouteService {

    private final RouteRepository routeRepository;

    private final ShipmentRepository shipmentRepository;

    private final UserRepository userRepository;

    private final OpenRouteService openRouteService;


    // =========================================================
    // CREATE ROUTE
    // =========================================================

    @Override
    public RouteResponse createRoute(
            RouteRequest request) {

        // =====================================================
        // 1. CHECK SHIPMENT
        // =====================================================

        Shipment shipment =
                shipmentRepository.findById(
                        request.getShipmentId()
                ).orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Shipment not found with id: "
                                        + request.getShipmentId()
                        )
                );


        // =====================================================
        // 2. CHECK IF ROUTE ALREADY EXISTS
        // =====================================================

        if (routeRepository
                .findByShipmentId(
                        request.getShipmentId()
                )
                .isPresent()) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Route already exists for shipment: "
                            + request.getShipmentId()
            );
        }


        // =====================================================
        // 3. CREATE ROUTE BUILDER
        // =====================================================

        Route.RouteBuilder routeBuilder =
                Route.builder()

                        .shipment(shipment)

                        .sourceAddress(
                                request.getSourceAddress()
                        )

                        .destinationAddress(
                                request.getDestinationAddress()
                        );


        // =====================================================
        // 4. ASSIGN DRIVER IF PROVIDED
        // =====================================================

        if (request.getDriverId() != null) {

            User driver =
                    userRepository.findById(
                            request.getDriverId()
                    ).orElseThrow(() ->
                            new ResponseStatusException(
                                    HttpStatus.NOT_FOUND,
                                    "Driver not found with id: "
                                            + request.getDriverId()
                            )
                    );

            routeBuilder.driver(driver);
        }


        // =====================================================
        // 5. GEOCODING
        // =====================================================

        double[] sourceCoordinates =
                null;

        double[] destinationCoordinates =
                null;


        try {

            if (request.getSourceAddress() != null
                    && !request.getSourceAddress()
                    .trim()
                    .isEmpty()) {

                sourceCoordinates =
                        openRouteService.geocode(
                                request.getSourceAddress()
                        );
            }


            if (request.getDestinationAddress() != null
                    && !request.getDestinationAddress()
                    .trim()
                    .isEmpty()) {

                destinationCoordinates =
                        openRouteService.geocode(
                                request.getDestinationAddress()
                        );
            }

        } catch (Exception e) {

            System.out.println(
                    "Geocoding failed."
            );

            System.out.println(
                    "Reason: "
                            + e.getMessage()
            );
        }


        // =====================================================
        // 6. SAVE SOURCE COORDINATES
        // =====================================================

        if (sourceCoordinates != null) {

            routeBuilder
                    .sourceLatitude(
                            sourceCoordinates[0]
                    )

                    .sourceLongitude(
                            sourceCoordinates[1]
                    );
        }


        // =====================================================
        // 7. SAVE DESTINATION COORDINATES
        // =====================================================

        if (destinationCoordinates != null) {

            routeBuilder
                    .destinationLatitude(
                            destinationCoordinates[0]
                    )

                    .destinationLongitude(
                            destinationCoordinates[1]
                    );
        }


        // =====================================================
        // 8. CALCULATE DISTANCE + ETA
        // =====================================================

        if (sourceCoordinates != null
                && destinationCoordinates != null) {

            try {

                Map<String, Object> directions =
                        openRouteService.getDirections(

                                sourceCoordinates[0],
                                sourceCoordinates[1],

                                destinationCoordinates[0],
                                destinationCoordinates[1]
                        );


                if (directions != null) {

                    Object distance =
                            directions.get(
                                    "distanceKm"
                            );

                    Object estimatedTime =
                            directions.get(
                                    "estimatedTimeMinutes"
                            );


                    if (distance != null) {

                        routeBuilder.distanceKm(
                                ((Number) distance)
                                        .doubleValue()
                        );
                    }


                    if (estimatedTime != null) {

                        routeBuilder
                                .estimatedTimeMinutes(
                                        ((Number) estimatedTime)
                                                .intValue()
                                );
                    }
                }

            } catch (Exception e) {

                System.out.println(
                        "Directions calculation failed."
                );

                System.out.println(
                        "Reason: "
                                + e.getMessage()
                );
            }
        }


        // =====================================================
        // 9. BUILD ROUTE
        // =====================================================

        Route route =
                routeBuilder.build();


        // =====================================================
        // 10. SAVE ROUTE
        // =====================================================

        Route savedRoute =
                routeRepository.save(
                        route
                );


        // =====================================================
        // 11. RETURN RESPONSE
        // =====================================================

        return mapToResponse(
                savedRoute
        );
    }


    // =========================================================
    // GET ROUTE BY SHIPMENT ID
    // =========================================================

    @Override
    public RouteResponse getRouteByShipmentId(
            Long shipmentId) {

        Route route =
                routeRepository
                        .findByShipmentId(
                                shipmentId
                        )
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Route not found for shipment: "
                                                + shipmentId
                                )
                        );


        return mapToResponse(
                route
        );
    }


    // =========================================================
    // ASSIGN DRIVER
    // =========================================================

    @Override
    public RouteResponse assignDriver(
            Long routeId,
            Long driverId) {

        Route route =
                routeRepository
                        .findById(routeId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Route not found with id: "
                                                + routeId
                                )
                        );


        User driver =
                userRepository
                        .findById(driverId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Driver not found with id: "
                                                + driverId
                                )
                        );


        route.setDriver(
                driver
        );


        Route updatedRoute =
                routeRepository.save(
                        route
                );


        return mapToResponse(
                updatedRoute
        );
    }


    // =========================================================
    // RECALCULATE EXISTING ROUTE
    // =========================================================

    @Override
    public RouteResponse recalculateRoute(
            Long routeId) {

        // =====================================================
        // 1. FIND EXISTING ROUTE
        // =====================================================

        Route route =
                routeRepository
                        .findById(routeId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Route not found with id: "
                                                + routeId
                                )
                        );


        // =====================================================
        // 2. CHECK SOURCE ADDRESS
        // =====================================================

        if (route.getSourceAddress() == null
                || route.getSourceAddress()
                .trim()
                .isEmpty()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Source address is missing"
            );
        }


        // =====================================================
        // 3. CHECK DESTINATION ADDRESS
        // =====================================================

        if (route.getDestinationAddress() == null
                || route.getDestinationAddress()
                .trim()
                .isEmpty()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Destination address is missing"
            );
        }


        // =====================================================
        // 4. GEOCODE SOURCE
        // =====================================================

        double[] sourceCoordinates =
                openRouteService.geocode(
                        route.getSourceAddress()
                );


        // =====================================================
        // 5. GEOCODE DESTINATION
        // =====================================================

        double[] destinationCoordinates =
                openRouteService.geocode(
                        route.getDestinationAddress()
                );


        // =====================================================
        // 6. CHECK COORDINATES
        // =====================================================

        if (sourceCoordinates == null
                || destinationCoordinates == null) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Unable to find coordinates for the route addresses"
            );
        }


        // =====================================================
        // 7. SAVE SOURCE COORDINATES
        // =====================================================

        route.setSourceLatitude(
                sourceCoordinates[0]
        );

        route.setSourceLongitude(
                sourceCoordinates[1]
        );


        // =====================================================
        // 8. SAVE DESTINATION COORDINATES
        // =====================================================

        route.setDestinationLatitude(
                destinationCoordinates[0]
        );

        route.setDestinationLongitude(
                destinationCoordinates[1]
        );


        // =====================================================
        // 9. CALCULATE DISTANCE + ETA
        // =====================================================

        Map<String, Object> directions =
                openRouteService.getDirections(

                        sourceCoordinates[0],
                        sourceCoordinates[1],

                        destinationCoordinates[0],
                        destinationCoordinates[1]
                );


        if (directions == null) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Unable to calculate route directions"
            );
        }


        Object distance =
                directions.get(
                        "distanceKm"
                );


        Object estimatedTime =
                directions.get(
                        "estimatedTimeMinutes"
                );


        if (distance != null) {

            route.setDistanceKm(
                    ((Number) distance)
                            .doubleValue()
            );
        }


        if (estimatedTime != null) {

            route.setEstimatedTimeMinutes(
                    ((Number) estimatedTime)
                            .intValue()
            );
        }


        // =====================================================
        // 10. SAVE UPDATED ROUTE
        // =====================================================

        Route updatedRoute =
                routeRepository.save(
                        route
                );


        // =====================================================
        // 11. RETURN RESPONSE
        // =====================================================

        return mapToResponse(
                updatedRoute
        );
    }


    // =========================================================
    // MAP ENTITY → RESPONSE
    // =========================================================

    private RouteResponse mapToResponse(
            Route route) {

        Long shipmentId = null;


        if (route.getShipment() != null) {

            shipmentId =
                    route.getShipment()
                            .getId();
        }


        Long driverId = null;


        if (route.getDriver() != null) {

            driverId =
                    route.getDriver()
                            .getId();
        }


        return RouteResponse.builder()

                .id(
                        route.getId()
                )

                .shipmentId(
                        shipmentId
                )

                .driverId(
                        driverId
                )

                .sourceAddress(
                        route.getSourceAddress()
                )

                .destinationAddress(
                        route.getDestinationAddress()
                )

                .sourceLatitude(
                        route.getSourceLatitude()
                )

                .sourceLongitude(
                        route.getSourceLongitude()
                )

                .destinationLatitude(
                        route.getDestinationLatitude()
                )

                .destinationLongitude(
                        route.getDestinationLongitude()
                )

                .distanceKm(
                        route.getDistanceKm()
                )

                .estimatedTimeMinutes(
                        route.getEstimatedTimeMinutes()
                )

                .status(
                        route.getStatus() != null
                                ? route.getStatus().name()
                                : null
                )

                .build();
    }
}