package com.shiptrack.shiptrack_pro.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;

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
        // Mock JSON response to bypass live API calls
        return "{\"routes\":[{\"distanceMeters\":840500,\"duration\":\"96000s\"}]}";
    }

    public RouteDetails calculateRoute(
            String origin,
            String destination) {

        try {
            System.out.println("Using mock route details for Origin: " + origin + " to Destination: " + destination);
            
            // Hardcoded mock values to allow immediate testing without a billing account
            BigDecimal distanceKm = new BigDecimal("840.50");
            Integer estimatedTimeMinutes = 960; // 16 hours

            return new RouteDetails(
                    distanceKm,
                    estimatedTimeMinutes
            );

        } catch (Exception e) {
            return RouteDetails.empty();
        }
    }

    private Coordinates geocode(String address) {
        return new Coordinates(12.9716, 77.5946); // Default mock coordinates (Bangalore)
    }

    private String getDirections(
            Coordinates origin,
            Coordinates destination) {
        return "{\"routes\":[{\"distanceMeters\":840500,\"duration\":\"96000s\"}]}";
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