package com.shiptrack.shiptrack_pro.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.Map;

@Service
public class GoogleMapsService {

    @Value("${google.maps.api-key}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper;

    public GoogleMapsService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public String getDistance(String origin, String destination) {
        try {
            Coordinates originCoordinates = geocode(origin);
            Coordinates destinationCoordinates = geocode(destination);

            if (originCoordinates == null
                    || destinationCoordinates == null) {
                return "{}";
            }

            return getDirections(
                    originCoordinates,
                    destinationCoordinates
            );

        } catch (Exception e) {
            return "{}";
        }
    }

    public RouteDetails calculateRoute(
            String origin,
            String destination) {

        try {
            String response = getDistance(origin, destination);

            JsonNode route = objectMapper
                    .readTree(response)
                    .path("routes")
                    .path(0);

            if (route.isMissingNode()) {
                return RouteDetails.empty();
            }

            BigDecimal distanceKm = null;
            Integer estimatedTimeMinutes = null;

            if (route.has("distanceMeters")) {
                distanceKm = BigDecimal
                        .valueOf(
                                route.get("distanceMeters").asDouble()
                                        / 1000
                        )
                        .setScale(2, RoundingMode.HALF_UP);
            }

            if (route.has("duration")) {
                String duration = route
                        .get("duration")
                        .asText()
                        .replace("s", "");

                estimatedTimeMinutes = new BigDecimal(duration)
                        .divide(
                                BigDecimal.valueOf(60),
                                0,
                                RoundingMode.CEILING
                        )
                        .intValue();
            }

            return new RouteDetails(
                    distanceKm,
                    estimatedTimeMinutes
            );

        } catch (Exception e) {
            // Google API fail ayina route save avvali
            return RouteDetails.empty();
        }
    }

    private Coordinates geocode(String address) {

    	String url = UriComponentsBuilder
    	        .newInstance()
    	        .scheme("https")
    	        .host("maps.googleapis.com")
    	        .path("/maps/api/geocode/json")
    	        .queryParam("address", address)
    	        .queryParam("key", apiKey)
    	        .build()
    	        .encode()
    	        .toUriString();

        ResponseEntity<String> response =
                restTemplate.getForEntity(url, String.class);

        try {
            JsonNode root =
                    objectMapper.readTree(response.getBody());

            String status = root
                    .path("status")
                    .asText();

            if (!"OK".equals(status)
                    || root.path("results").isEmpty()) {
                return null;
            }

            JsonNode location = root
                    .path("results")
                    .path(0)
                    .path("geometry")
                    .path("location");

            if (!location.has("lat")
                    || !location.has("lng")) {
                return null;
            }

            return new Coordinates(
                    location.get("lat").asDouble(),
                    location.get("lng").asDouble()
            );

        } catch (Exception e) {
            return null;
        }
    }

    private String getDirections(
            Coordinates origin,
            Coordinates destination) {

        String url =
                "https://routes.googleapis.com/directions/v2:computeRoutes";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-Goog-Api-Key", apiKey);
        headers.set(
                "X-Goog-FieldMask",
                "routes.distanceMeters,routes.duration"
        );

        Map<String, Object> originLocation = Map.of(
                "location",
                Map.of(
                        "latLng",
                        Map.of(
                                "latitude", origin.latitude(),
                                "longitude", origin.longitude()
                        )
                )
        );

        Map<String, Object> destinationLocation = Map.of(
                "location",
                Map.of(
                        "latLng",
                        Map.of(
                                "latitude", destination.latitude(),
                                "longitude", destination.longitude()
                        )
                )
        );

        Map<String, Object> requestBody = new HashMap<>();

        requestBody.put("origin", originLocation);
        requestBody.put("destination", destinationLocation);
        requestBody.put("travelMode", "DRIVE");

        HttpEntity<Map<String, Object>> request =
                new HttpEntity<>(requestBody, headers);

        ResponseEntity<String> response =
                restTemplate.postForEntity(
                        url,
                        request,
                        String.class
                );

        return response.getBody();
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
        public static RouteDetails empty() {
            return new RouteDetails(null, null);
        }
    }
}