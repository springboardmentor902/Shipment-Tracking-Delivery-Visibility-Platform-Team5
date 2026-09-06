package com.shiptrack.shiptrack_pro.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shiptrack.shiptrack_pro.dto.RouteAlternative;

import org.springframework.beans.factory.annotation.Value;
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
import java.util.ArrayList;
import java.util.List;

@Service
public class GoogleMapsService {

    private final RestTemplate restTemplate =
            new RestTemplate();

    private final ObjectMapper objectMapper;

    /*
     * Google Maps API key.
     *
     * Keep the real key outside GitHub.
     */
    @Value("${google.maps.api.key:}")
    private String googleMapsApiKey;

    public GoogleMapsService(
            ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    /*
     * Existing distance/routing method.
     *
     * Google Maps is used when an API key is configured.
     * Otherwise the existing Nominatim + OSRM flow is used.
     */
    public String getDistance(
            String origin,
            String destination) {

        try {

            if (isGoogleMapsConfigured()) {

                return getGoogleDirections(
                        origin,
                        destination
                );
            }

            Coordinates originCoordinates =
                    geocode(origin);

            Coordinates destinationCoordinates =
                    geocode(destination);

            if (originCoordinates == null) {
                throw new RuntimeException(
                        "Unable to geocode origin: "
                                + origin
                );
            }

            if (destinationCoordinates == null) {
                throw new RuntimeException(
                        "Unable to geocode destination: "
                                + destination
                );
            }

            System.out.println(
                    "Origin coordinates: "
                            + originCoordinates
            );

            System.out.println(
                    "Destination coordinates: "
                            + destinationCoordinates
            );

            return getDirections(
                    originCoordinates,
                    destinationCoordinates
            );

        } catch (Exception e) {

            System.err.println(
                    "Route calculation error: "
                            + e.getMessage()
            );

            throw new RuntimeException(
                    "Unable to calculate route: "
                            + e.getMessage(),
                    e
            );
        }
    }

    /*
     * Existing method used by RouteServiceImpl.
     */
    public RouteDetails calculateRoute(
            String origin,
            String destination) {

        try {

            /*
             * Use Google Maps when configured.
             */
            if (isGoogleMapsConfigured()) {

                String response =
                        getGoogleDirections(
                                origin,
                                destination
                        );

                JsonNode root =
                        objectMapper.readTree(
                                response
                        );

                String status =
                        root.path("status")
                                .asText();

                if (!"OK".equalsIgnoreCase(status)) {

                    throw new RuntimeException(
                            "Google Maps route failed. "
                                    + "Response status: "
                                    + status
                    );
                }

                JsonNode routes =
                        root.path("routes");

                if (!routes.isArray()
                        || routes.isEmpty()) {

                    throw new RuntimeException(
                            "No route returned by Google Maps"
                    );
                }

                return parseGoogleRoute(
                        routes.get(0)
                );
            }

            /*
             * Existing OSRM flow.
             */
            String response =
                    getDistance(
                            origin,
                            destination
                    );

            System.out.println(
                    "OSRM response: "
                            + response
            );

            JsonNode root =
                    objectMapper.readTree(
                            response
                    );

            String code =
                    root.path("code")
                            .asText();

            if (!"Ok".equalsIgnoreCase(code)) {

                throw new RuntimeException(
                        "OSRM route failed. "
                                + "Response code: "
                                + code
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

            return parseOsrmRoute(route);

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

    /*
     * Gets route alternatives and allows the
     * optimization service to select the route
     * with the lowest traffic-adjusted duration.
     *
     * Google Maps is tried first.
     *
     * If Google Maps is unavailable, returns REQUEST_DENIED,
     * or returns no usable alternatives, OSRM is used as
     * the fallback.
     */
    public List<RouteAlternative> getRouteAlternatives(
            String origin,
            String destination) {

        /*
         * First try Google Maps when an API key
         * is configured.
         */
        if (isGoogleMapsConfigured()) {

            try {

                String response =
                        getGoogleDirections(
                                origin,
                                destination
                        );

                JsonNode root =
                        objectMapper.readTree(
                                response
                        );

                String status =
                        root.path("status")
                                .asText();

                if ("OK".equalsIgnoreCase(status)) {

                    JsonNode routes =
                            root.path("routes");

                    if (routes.isArray()
                            && !routes.isEmpty()) {

                        List<RouteAlternative> alternatives =
                                new ArrayList<>();

                        for (JsonNode route : routes) {

                            alternatives.add(
                                    parseGoogleAlternative(
                                            route
                                    )
                            );
                        }

                        System.out.println(
                                "Google Maps returned "
                                        + alternatives.size()
                                        + " route alternatives."
                        );

                        return alternatives;
                    }

                    System.err.println(
                            "Google Maps returned no usable "
                                    + "route alternatives. "
                                    + "Falling back to OSRM."
                    );

                } else {

                    /*
                     * IMPORTANT:
                     * Do not throw here.
                     *
                     * Google may return REQUEST_DENIED
                     * because of API-key restrictions,
                     * disabled APIs, billing, etc.
                     *
                     * We continue to OSRM.
                     */
                    System.err.println(
                            "Google Maps route alternatives "
                                    + "unavailable. Status: "
                                    + status
                                    + ". Falling back to OSRM."
                    );
                }

            } catch (Exception e) {

                /*
                 * Google failed completely.
                 * Continue with OSRM fallback.
                 */
                System.err.println(
                        "Google Maps alternatives failed: "
                                + e.getMessage()
                                + ". Falling back to OSRM."
                );
            }
        }

        /*
         * OSRM FALLBACK
         *
         * OSRM does not provide Google's
         * duration_in_traffic.
         *
         * Therefore normal OSRM duration is used
         * as the traffic-adjusted duration fallback.
         */
        try {

            String response =
                    getOsrmRouteAlternatives(
                            origin,
                            destination
                    );

            JsonNode root =
                    objectMapper.readTree(
                            response
                    );

            String code =
                    root.path("code")
                            .asText();

            if (!"Ok".equalsIgnoreCase(code)) {

                throw new RuntimeException(
                        "OSRM route alternatives failed. "
                                + "Response code: "
                                + code
                );
            }

            JsonNode routes =
                    root.path("routes");

            if (!routes.isArray()
                    || routes.isEmpty()) {

                throw new RuntimeException(
                        "No route alternatives returned by OSRM"
                );
            }

            List<RouteAlternative> alternatives =
                    new ArrayList<>();

            for (JsonNode route : routes) {

                alternatives.add(
                        parseOsrmAlternative(
                                route
                        )
                );
            }

            System.out.println(
                    "OSRM returned "
                            + alternatives.size()
                            + " route alternatives."
            );

            return alternatives;

        } catch (Exception e) {

            System.err.println(
                    "OSRM route alternatives failed: "
                            + e.getMessage()
            );

            throw new RuntimeException(
                    "Unable to retrieve route alternatives: "
                            + e.getMessage(),
                    e
            );
        }
    }

    /*
     * Parse Google route and use duration_in_traffic
     * when it is available.
     */
    private RouteAlternative parseGoogleAlternative(
            JsonNode route) {

        JsonNode legs =
                route.path("legs");

        if (!legs.isArray()
                || legs.isEmpty()) {

            throw new RuntimeException(
                    "Google route contains no legs"
            );
        }

        JsonNode leg =
                legs.get(0);

        double distanceMeters =
                leg.path("distance")
                        .path("value")
                        .asDouble();

        int normalDurationSeconds =
                leg.path("duration")
                        .path("value")
                        .asInt();

        JsonNode trafficNode =
                leg.path("duration_in_traffic");

        int trafficDurationSeconds;

        if (trafficNode.isObject()
                && trafficNode.has("value")) {

            trafficDurationSeconds =
                    trafficNode.path("value")
                            .asInt();

        } else {

            trafficDurationSeconds =
                    normalDurationSeconds;
        }

        BigDecimal distanceKm =
                BigDecimal
                        .valueOf(
                                distanceMeters / 1000.0
                        )
                        .setScale(
                                2,
                                RoundingMode.HALF_UP
                        );

        int durationMinutes =
                (int) Math.ceil(
                        normalDurationSeconds / 60.0
                );

        int trafficAdjustedDurationMinutes =
                (int) Math.ceil(
                        trafficDurationSeconds / 60.0
                );

        String summary =
                route.path("summary")
                        .asText(
                                "Alternative route"
                        );

        return RouteAlternative.builder()
                .distanceKm(distanceKm)
                .durationMinutes(
                        durationMinutes
                )
                .trafficAdjustedDurationMinutes(
                        trafficAdjustedDurationMinutes
                )
                .summary(summary)
                .build();
    }

    /*
     * Parse the selected Google route for the
     * existing calculateRoute() method.
     */
    private RouteDetails parseGoogleRoute(
            JsonNode route) {

        JsonNode legs =
                route.path("legs");

        if (!legs.isArray()
                || legs.isEmpty()) {

            throw new RuntimeException(
                    "Google route contains no legs"
            );
        }

        JsonNode leg =
                legs.get(0);

        double distanceMeters =
                leg.path("distance")
                        .path("value")
                        .asDouble();

        JsonNode trafficNode =
                leg.path("duration_in_traffic");

        int durationSeconds;

        if (trafficNode.isObject()
                && trafficNode.has("value")) {

            durationSeconds =
                    trafficNode.path("value")
                            .asInt();

        } else {

            durationSeconds =
                    leg.path("duration")
                            .path("value")
                            .asInt();
        }

        BigDecimal distanceKm =
                BigDecimal
                        .valueOf(
                                distanceMeters / 1000.0
                        )
                        .setScale(
                                2,
                                RoundingMode.HALF_UP
                        );

        int estimatedTimeMinutes =
                (int) Math.ceil(
                        durationSeconds / 60.0
                );

        System.out.println(
                "Google route distance: "
                        + distanceKm
                        + " km"
        );

        System.out.println(
                "Google route estimated time: "
                        + estimatedTimeMinutes
                        + " minutes"
        );

        return new RouteDetails(
                distanceKm,
                estimatedTimeMinutes
        );
    }

    /*
     * Parse an OSRM route alternative.
     */
    private RouteAlternative parseOsrmAlternative(
            JsonNode route) {

        double distanceMeters =
                route.path("distance")
                        .asDouble();

        double durationSeconds =
                route.path("duration")
                        .asDouble();

        BigDecimal distanceKm =
                BigDecimal
                        .valueOf(
                                distanceMeters / 1000.0
                        )
                        .setScale(
                                2,
                                RoundingMode.HALF_UP
                        );

        int durationMinutes =
                (int) Math.ceil(
                        durationSeconds / 60.0
                );

        String summary =
                "OSRM alternative route";

        return RouteAlternative.builder()
                .distanceKm(distanceKm)
                .durationMinutes(
                        durationMinutes
                )
                .trafficAdjustedDurationMinutes(
                        durationMinutes
                )
                .summary(summary)
                .build();
    }

    /*
     * Google Directions API.
     *
     * Required mentor parameters:
     *
     * alternatives=true
     * departure_time=now
     */
    private String getGoogleDirections(
            String origin,
            String destination) {

        String url =
                UriComponentsBuilder
                        .newInstance()
                        .scheme("https")
                        .host("maps.googleapis.com")
                        .path(
                                "/maps/api/directions/json"
                        )
                        .queryParam(
                                "origin",
                                origin
                        )
                        .queryParam(
                                "destination",
                                destination
                        )
                        .queryParam(
                                "mode",
                                "driving"
                        )
                        .queryParam(
                                "alternatives",
                                "true"
                        )
                        .queryParam(
                                "departure_time",
                                "now"
                        )
                        .queryParam(
                                "key",
                                googleMapsApiKey
                        )
                        .build()
                        .toUriString();

        HttpHeaders headers =
                new HttpHeaders();

        headers.setAccept(
                List.of(
                        MediaType.APPLICATION_JSON
                )
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
    }

    /*
     * OSRM alternative-route request.
     */
    private String getOsrmRouteAlternatives(
            String origin,
            String destination) {

        try {

            Coordinates originCoordinates =
                    geocode(origin);

            Coordinates destinationCoordinates =
                    geocode(destination);

            if (originCoordinates == null) {

                throw new RuntimeException(
                        "Unable to geocode origin: "
                                + origin
                );
            }

            if (destinationCoordinates == null) {

                throw new RuntimeException(
                        "Unable to geocode destination: "
                                + destination
                );
            }

            String coordinates =
                    originCoordinates.longitude()
                            + ","
                            + originCoordinates.latitude()
                            + ";"
                            + destinationCoordinates.longitude()
                            + ","
                            + destinationCoordinates.latitude();

            String url =
                    UriComponentsBuilder
                            .newInstance()
                            .scheme("https")
                            .host(
                                    "router.project-osrm.org"
                            )
                            .path(
                                    "/route/v1/driving/"
                                            + coordinates
                            )
                            .queryParam(
                                    "overview",
                                    "false"
                            )
                            .queryParam(
                                    "alternatives",
                                    "true"
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
                    List.of(
                            MediaType.APPLICATION_JSON
                    )
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

            throw new RuntimeException(
                    "OSRM routing failed: "
                            + e.getMessage(),
                    e
            );
        }
    }

    /*
     * Existing Nominatim geocoding.
     */
    private Coordinates geocode(
            String address) {

        try {

            String searchAddress =
                    address;

            if (!address
                    .toLowerCase()
                    .contains("india")) {

                searchAddress =
                        address + ", India";
            }

            String url =
                    UriComponentsBuilder
                            .newInstance()
                            .scheme("https")
                            .host(
                                    "nominatim.openstreetmap.org"
                            )
                            .path("/search")
                            .queryParam(
                                    "q",
                                    searchAddress
                            )
                            .queryParam(
                                    "format",
                                    "json"
                            )
                            .queryParam(
                                    "limit",
                                    "1"
                            )
                            .queryParam(
                                    "countrycodes",
                                    "in"
                            )
                            .queryParam(
                                    "addressdetails",
                                    "1"
                            )
                            .build()
                            .toUriString();

            HttpHeaders headers =
                    new HttpHeaders();

            headers.set(
                    HttpHeaders.USER_AGENT,
                    "ShipTrack/1.0 "
                            + "(shipment tracking application)"
            );

            headers.setAccept(
                    List.of(
                            MediaType.APPLICATION_JSON
                    )
            );

            HttpEntity<Void> request =
                    new HttpEntity<>(headers);

            System.out.println(
                    "Nominatim URL: "
                            + url
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
                    Double.parseDouble(
                            latitudeText
                    );

            double longitude =
                    Double.parseDouble(
                            longitudeText
                    );

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

    /*
     * Existing OSRM routing method.
     */
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
                            .host(
                                    "router.project-osrm.org"
                            )
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
                    List.of(
                            MediaType.APPLICATION_JSON
                    )
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

    private RouteDetails parseOsrmRoute(
            JsonNode route) {

        double distanceMeters =
                route.path("distance")
                        .asDouble();

        double durationSeconds =
                route.path("duration")
                        .asDouble();

        BigDecimal distanceKm =
                BigDecimal
                        .valueOf(
                                distanceMeters / 1000.0
                        )
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
                        + distanceKm
                        + " km, "
                        + estimatedTimeMinutes
                        + " minutes"
        );

        return new RouteDetails(
                distanceKm,
                estimatedTimeMinutes
        );
    }

    private boolean isGoogleMapsConfigured() {

        return googleMapsApiKey != null
                && !googleMapsApiKey.isBlank()
                && !"YOUR_GOOGLE_MAPS_API_KEY"
                        .equalsIgnoreCase(
                                googleMapsApiKey.trim()
                        );
    }

    private record Coordinates(
            double latitude,
            double longitude) {
    }

    public record RouteDetails(
            BigDecimal distanceKm,
            Integer estimatedTimeMinutes) {
    }
}