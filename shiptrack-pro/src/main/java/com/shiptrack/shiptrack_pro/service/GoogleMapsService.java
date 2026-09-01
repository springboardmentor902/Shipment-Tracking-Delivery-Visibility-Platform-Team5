package com.shiptrack.shiptrack_pro.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
public class GoogleMapsService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper;

    public GoogleMapsService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public String getDistance(String origin, String destination) {

        try {
            Coordinates originCoordinates = geocode(origin);
            Coordinates destinationCoordinates = geocode(destination);

            if (originCoordinates == null) {
                throw new RuntimeException(
                        "Unable to geocode origin: " + origin
                );
            }

            if (destinationCoordinates == null) {
                throw new RuntimeException(
                        "Unable to geocode destination: " + destination
                );
            }

            System.out.println(
                    "Origin coordinates: " + originCoordinates
            );

            System.out.println(
                    "Destination coordinates: " + destinationCoordinates
            );

            return getDirections(
                    originCoordinates,
                    destinationCoordinates
            );

        } catch (Exception e) {
            System.err.println(
                    "Route calculation error: " + e.getMessage()
            );

            throw new RuntimeException(
                    "Unable to calculate route: " + e.getMessage(),
                    e
            );
        }
    }

    public RouteDetails calculateRoute(
            String origin,
            String destination) {

        try {
            String response = getDistance(
                    origin,
                    destination
            );

            System.out.println(
                    "OSRM response: " + response
            );

            JsonNode root =
                    objectMapper.readTree(response);

            String code =
                    root.path("code").asText();

            if (!"Ok".equalsIgnoreCase(code)) {
                throw new RuntimeException(
                        "OSRM route failed. Response code: " + code
                );
            }

            JsonNode routes =
                    root.path("routes");

            if (!routes.isArray()
                    || routes.isEmpty()) {

                throw new RuntimeException(
                        "No route returned by OSRM"
                );
            }

            JsonNode route =
                    routes.get(0);

            if (!route.has("distance")
                    || route.get("distance").isNull()) {

                throw new RuntimeException(
                        "OSRM did not return distance"
                );
            }

            if (!route.has("duration")
                    || route.get("duration").isNull()) {

                throw new RuntimeException(
                        "OSRM did not return duration"
                );
            }

            double distanceMeters =
                    route.get("distance").asDouble();

            double durationSeconds =
                    route.get("duration").asDouble();

            BigDecimal distanceKm =
                    BigDecimal
                            .valueOf(distanceMeters / 1000.0)
                            .setScale(
                                    2,
                                    RoundingMode.HALF_UP
                            );

            Integer estimatedTimeMinutes =
                    BigDecimal
                            .valueOf(durationSeconds)
                            .divide(
                                    BigDecimal.valueOf(60),
                                    0,
                                    RoundingMode.CEILING
                            )
                            .intValue();

            System.out.println(
                    "Calculated route: "
                            + origin
                            + " -> "
                            + destination
            );

            System.out.println(
                    "Distance: "
                            + distanceKm
                            + " km"
            );

            System.out.println(
                    "Estimated time: "
                            + estimatedTimeMinutes
                            + " minutes"
            );

            return new RouteDetails(
                    distanceKm,
                    estimatedTimeMinutes
            );

        } catch (Exception e) {

            System.err.println(
                    "Route calculation failed: "
                            + e.getMessage()
            );

            throw new RuntimeException(
                    "Route calculation failed: "
                            + e.getMessage(),
                    e
            );
        }
    }

    private Coordinates geocode(String address) {

        try {

            String searchAddress = address;

            if (!address.toLowerCase().contains("india")) {
                searchAddress = address + ", India";
            }

            String url =
                    UriComponentsBuilder
                            .newInstance()
                            .scheme("https")
                            .host("nominatim.openstreetmap.org")
                            .path("/search")
                            .queryParam("q", searchAddress)
                            .queryParam("format", "json")
                            .queryParam("limit", "1")
                            .queryParam("countrycodes", "in")
                            .queryParam("addressdetails", "1")
                            .build()
                            .toUriString();

            HttpHeaders headers =
                    new HttpHeaders();

            headers.set(
                    HttpHeaders.USER_AGENT,
                    "ShipTrack/1.0 (shipment tracking application)"
            );

            headers.setAccept(
                    List.of(MediaType.APPLICATION_JSON)
            );

            HttpEntity<Void> request =
                    new HttpEntity<>(headers);

            System.out.println(
                    "Nominatim URL: " + url
            );

            ResponseEntity<String> response =
                    restTemplate.exchange(
                            url,
                            HttpMethod.GET,
                            request,
                            String.class
                    );

            System.out.println(
                    "Nominatim response: "
                            + response.getBody()
            );

            JsonNode results =
                    objectMapper.readTree(
                            response.getBody()
                    );

            if (!results.isArray()
                    || results.isEmpty()) {

                System.err.println(
                        "No location found for: "
                                + searchAddress
                );

                return null;
            }

            JsonNode firstResult =
                    results.get(0);

            String latitudeText =
                    firstResult
                            .path("lat")
                            .asText();

            String longitudeText =
                    firstResult
                            .path("lon")
                            .asText();

            if (latitudeText.isBlank()
                    || longitudeText.isBlank()) {

                throw new RuntimeException(
                        "Invalid coordinates returned for: "
                                + searchAddress
                );
            }

            double latitude =
                    Double.parseDouble(latitudeText);

            double longitude =
                    Double.parseDouble(longitudeText);

            System.out.println(
                    "Geocoded "
                            + searchAddress
                            + " -> "
                            + latitude
                            + ", "
                            + longitude
            );

            return new Coordinates(
                    latitude,
                    longitude
            );

        } catch (Exception e) {

            System.err.println(
                    "Geocoding error for "
                            + address
                            + ": "
                            + e.getMessage()
            );

            throw new RuntimeException(
                    "Geocoding failed for: "
                            + address,
                    e
            );
        }
    }

    private String getDirections(
            Coordinates origin,
            Coordinates destination) {

        try {

            String coordinates =
                    origin.longitude()
                            + ","
                            + origin.latitude()
                            + ";"
                            + destination.longitude()
                            + ","
                            + destination.latitude();

            String url =
                    UriComponentsBuilder
                            .newInstance()
                            .scheme("https")
                            .host("router.project-osrm.org")
                            .path(
                                    "/route/v1/driving/"
                                            + coordinates
                            )
                            .queryParam(
                                    "overview",
                                    "false"
                            )
                            .build()
                            .toUriString();

            HttpHeaders headers =
                    new HttpHeaders();

            headers.set(
                    HttpHeaders.USER_AGENT,
                    "ShipTrack/1.0"
            );

            headers.setAccept(
                    List.of(MediaType.APPLICATION_JSON)
            );

            HttpEntity<Void> request =
                    new HttpEntity<>(headers);

            ResponseEntity<String> response =
                    restTemplate.exchange(
                            url,
                            HttpMethod.GET,
                            request,
                            String.class
                    );

            return response.getBody();

        } catch (Exception e) {

            System.err.println(
                    "OSRM routing error: "
                            + e.getMessage()
            );

            throw new RuntimeException(
                    "OSRM routing failed: "
                            + e.getMessage(),
                    e
            );
        }
    }

    private record Coordinates(
            double latitude,
            double longitude
    ) {
    }

    public record RouteDetails(
            BigDecimal distanceKm,
            Integer estimatedTimeMinutes
    ) {
    }
}