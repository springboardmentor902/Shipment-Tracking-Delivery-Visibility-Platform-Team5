package com.shiptrack.shiptrack_pro.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.HashMap;
import java.util.Map;

@Service
public class OpenRouteService {

    @Value("${openrouteservice.api.key}")
    private String apiKey;

    private final RestTemplate restTemplate =
            new RestTemplate();

    private final ObjectMapper objectMapper =
            new ObjectMapper();


    // =========================================================
    // NOMINATIM GEOCODING
    // Address -> Latitude + Longitude
    // =========================================================

    private static final String GEOCODING_URL =
            "https://nominatim.openstreetmap.org/search";


    // =========================================================
    // HEIGIT / OPENROUTESERVICE DIRECTIONS
    // Coordinates -> Distance + ETA
    // =========================================================

    private static final String DIRECTIONS_URL =
            "https://api.heigit.org/openrouteservice/v2/directions/driving-car";


    // =========================================================
    // GEOCODING
    // =========================================================

    public double[] geocode(String address) {

        try {

            String url = UriComponentsBuilder
                    .fromUriString(GEOCODING_URL)
                    .queryParam("q", address)
                    .queryParam("format", "jsonv2")
                    .queryParam("limit", 1)
                    .toUriString();


            System.out.println(
                    "Geocoding address: " + address
            );


            HttpHeaders headers =
                    new HttpHeaders();

            // Identify our application to Nominatim
            headers.set(
                    "User-Agent",
                    "ShipTrack-Pro/1.0"
            );


            HttpEntity<Void> entity =
                    new HttpEntity<>(headers);


            ResponseEntity<String> response =
                    restTemplate.getForEntity(
                            url,
                            String.class
                    );


            if (!response.getStatusCode()
                    .is2xxSuccessful()) {

                System.out.println(
                        "Geocoding failed. Status: "
                                + response.getStatusCode()
                );

                return null;
            }


            if (response.getBody() == null) {

                System.out.println(
                        "Geocoding returned empty response"
                );

                return null;
            }


            JsonNode root =
                    objectMapper.readTree(
                            response.getBody()
                    );


            if (!root.isArray()
                    || root.isEmpty()) {

                System.out.println(
                        "Address not found: "
                                + address
                );

                return null;
            }


            JsonNode firstResult =
                    root.get(0);


            String latitudeText =
                    firstResult
                            .path("lat")
                            .asText();


            String longitudeText =
                    firstResult
                            .path("lon")
                            .asText();


            if (latitudeText.isEmpty()
                    || longitudeText.isEmpty()) {

                System.out.println(
                        "Latitude/Longitude missing"
                );

                return null;
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
                    "Latitude: " + latitude
            );

            System.out.println(
                    "Longitude: " + longitude
            );


            return new double[]{
                    latitude,
                    longitude
            };


        } catch (Exception e) {

            System.out.println(
                    "Geocoding failed for: "
                            + address
            );

            System.out.println(
                    "Reason: "
                            + e.getMessage()
            );

            return null;
        }
    }


    // =========================================================
    // DIRECTIONS
    // Coordinates -> Distance + ETA
    // =========================================================

    public Map<String, Object> getDirections(
            double sourceLatitude,
            double sourceLongitude,
            double destinationLatitude,
            double destinationLongitude) {

        try {

            Map<String, Object> requestBody =
                    new HashMap<>();


            /*
             * OpenRouteService expects:
             *
             * [longitude, latitude]
             */

            requestBody.put(
                    "coordinates",
                    new double[][]{

                            {
                                    sourceLongitude,
                                    sourceLatitude
                            },

                            {
                                    destinationLongitude,
                                    destinationLatitude
                            }

                    }
            );


            // =================================================
            // HEADERS
            // =================================================

            HttpHeaders headers =
                    new HttpHeaders();


            headers.set(
                    "Authorization",
                    apiKey
            );


            headers.set(
                    "Content-Type",
                    "application/json"
            );


            HttpEntity<Map<String, Object>> entity =
                    new HttpEntity<>(
                            requestBody,
                            headers
                    );


            System.out.println(
                    "Calling directions API..."
            );


            ResponseEntity<String> response =
                    restTemplate.postForEntity(
                            DIRECTIONS_URL,
                            entity,
                            String.class
                    );


            if (!response.getStatusCode()
                    .is2xxSuccessful()) {

                System.out.println(
                        "Directions API failed. Status: "
                                + response.getStatusCode()
                );

                return null;
            }


            if (response.getBody() == null) {

                System.out.println(
                        "Directions API returned empty response"
                );

                return null;
            }


            JsonNode root =
                    objectMapper.readTree(
                            response.getBody()
                    );


            JsonNode routes =
                    root.path("routes");


            if (!routes.isArray()
                    || routes.isEmpty()) {

                System.out.println(
                        "No route found"
                );

                return null;
            }


            JsonNode summary =
                    routes
                            .get(0)
                            .path("summary");


            double distanceMeters =
                    summary
                            .path("distance")
                            .asDouble();


            double durationSeconds =
                    summary
                            .path("duration")
                            .asDouble();


            double distanceKm =
                    distanceMeters / 1000.0;


            int estimatedTimeMinutes =
                    (int) Math.ceil(
                            durationSeconds / 60.0
                    );


            Map<String, Object> result =
                    new HashMap<>();


            result.put(
                    "distanceKm",
                    distanceKm
            );


            result.put(
                    "estimatedTimeMinutes",
                    estimatedTimeMinutes
            );


            System.out.println(
                    "Distance: "
                            + distanceKm
                            + " km"
            );


            System.out.println(
                    "ETA: "
                            + estimatedTimeMinutes
                            + " minutes"
            );


            return result;


        } catch (Exception e) {

            System.out.println(
                    "Directions API failed"
            );


            System.out.println(
                    "Reason: "
                            + e.getMessage()
            );


            return null;
        }
    }
}