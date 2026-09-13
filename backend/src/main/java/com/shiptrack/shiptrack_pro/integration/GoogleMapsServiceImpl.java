package com.shiptrack.shiptrack_pro.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Optional;

/**
 * Real implementation backed by Google's HTTP APIs:
 *   https://maps.googleapis.com/maps/api/geocode/json
 *   https://maps.googleapis.com/maps/api/directions/json
 *
 * The API key is read from the GOOGLE_MAPS_API_KEY environment variable (see
 * application.properties: google.maps.api-key=${GOOGLE_MAPS_API_KEY:}) - it is never
 * hardcoded here and never has a real default value baked into the source.
 *
 * Every public method is wrapped in try/catch: a missing key, network failure, timeout, or
 * an API-level error status all resolve to Optional.empty() and a logged warning rather than
 * a thrown exception, so a caller like RouteService can always save the route regardless of
 * whether Maps answered.
 */
@Service
public class GoogleMapsServiceImpl implements GoogleMapsService {

    private static final Logger log = LoggerFactory.getLogger(GoogleMapsServiceImpl.class);
    private static final String GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json";
    private static final String DIRECTIONS_URL = "https://maps.googleapis.com/maps/api/directions/json";

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${google.maps.api-key:}")
    private String apiKey;

    public GoogleMapsServiceImpl(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    @Override
    public Optional<GeoPoint> geocode(String address) {
        if (!isConfigured() || address == null || address.isBlank()) {
            return Optional.empty();
        }

        try {
            String url = UriComponentsBuilder.fromHttpUrl(GEOCODE_URL)
                    .queryParam("address", address)
                    .queryParam("key", apiKey)
                    .encode(StandardCharsets.UTF_8)
                    .toUriString();

            String body = restTemplate.getForObject(url, String.class);
            JsonNode root = objectMapper.readTree(body);

            if (!"OK".equals(root.path("status").asText())) {
                log.warn("Geocoding API returned status {} for address '{}'", root.path("status").asText(), address);
                return Optional.empty();
            }

            JsonNode location = root.path("results").get(0).path("geometry").path("location");
            return Optional.of(new GeoPoint(location.path("lat").asDouble(), location.path("lng").asDouble()));

        } catch (Exception e) {
            log.warn("Geocoding failed for address '{}': {}", address, e.getMessage());
            return Optional.empty();
        }
    }

    @Override
    public Optional<RouteEstimate> getDirections(GeoPoint origin, GeoPoint destination) {
        if (!isConfigured() || origin == null || destination == null) {
            return Optional.empty();
        }

        try {
            String url = UriComponentsBuilder.fromHttpUrl(DIRECTIONS_URL)
                    .queryParam("origin", origin.latitude() + "," + origin.longitude())
                    .queryParam("destination", destination.latitude() + "," + destination.longitude())
                    .queryParam("mode", "driving")
                    .queryParam("key", apiKey)
                    .toUriString();

            String body = restTemplate.getForObject(url, String.class);
            JsonNode root = objectMapper.readTree(body);

            if (!"OK".equals(root.path("status").asText())) {
                log.warn("Directions API returned status {}", root.path("status").asText());
                return Optional.empty();
            }

            JsonNode leg = root.path("routes").get(0).path("legs").get(0);
            int meters = leg.path("distance").path("value").asInt();
            int seconds = leg.path("duration").path("value").asInt();

            BigDecimal distanceKm = BigDecimal.valueOf(meters / 1000.0).setScale(2, RoundingMode.HALF_UP);
            int minutes = Math.round(seconds / 60.0f);

            return Optional.of(new RouteEstimate(distanceKm, minutes));

        } catch (Exception e) {
            log.warn("Directions lookup failed: {}", e.getMessage());
            return Optional.empty();
        }
    }

    @Override
    public Optional<RouteEstimate> estimateRoute(String originAddress, String destinationAddress) {
        try {
            Optional<GeoPoint> origin = geocode(originAddress);
            Optional<GeoPoint> destination = geocode(destinationAddress);

            if (origin.isEmpty() || destination.isEmpty()) {
                return Optional.empty();
            }

            return getDirections(origin.get(), destination.get());

        } catch (Exception e) {
            // Belt-and-braces: geocode()/getDirections() already swallow their own errors,
            // but this guarantees estimateRoute() itself can never propagate an exception.
            log.warn("Route estimation failed for '{}' -> '{}': {}", originAddress, destinationAddress, e.getMessage());
            return Optional.empty();
        }
    }

    @Override
    public List<RouteAlternativeDTO> getRouteAlternatives(GeoPoint origin, GeoPoint destination) {
        if (!isConfigured() || origin == null || destination == null) {
            return List.of();
        }

        try {
            // departure_time=now + traffic_model is what makes Google populate
            // duration_in_traffic on each leg - without it, every alternative would only
            // have the traffic-agnostic "typical" duration to compare on.
            String url = UriComponentsBuilder.fromHttpUrl(DIRECTIONS_URL)
                    .queryParam("origin", origin.latitude() + "," + origin.longitude())
                    .queryParam("destination", destination.latitude() + "," + destination.longitude())
                    .queryParam("mode", "driving")
                    .queryParam("alternatives", "true")
                    .queryParam("departure_time", "now")
                    .queryParam("traffic_model", "best_guess")
                    .queryParam("key", apiKey)
                    .toUriString();

            String body = restTemplate.getForObject(url, String.class);
            JsonNode root = objectMapper.readTree(body);

            if (!"OK".equals(root.path("status").asText())) {
                log.warn("Directions API (alternatives) returned status {}", root.path("status").asText());
                return List.of();
            }

            List<RouteAlternativeDTO> alternatives = new java.util.ArrayList<>();
            for (JsonNode routeNode : root.path("routes")) {
                JsonNode leg = routeNode.path("legs").get(0);
                if (leg == null) {
                    continue;
                }

                int meters = leg.path("distance").path("value").asInt();
                int seconds = leg.path("duration").path("value").asInt();
                BigDecimal distanceKm = BigDecimal.valueOf(meters / 1000.0).setScale(2, RoundingMode.HALF_UP);
                int minutes = Math.round(seconds / 60.0f);

                JsonNode trafficNode = leg.path("duration_in_traffic");
                Integer trafficMinutes = trafficNode.isMissingNode()
                        ? null
                        : Math.round(trafficNode.path("value").asInt() / 60.0f);

                String summary = routeNode.path("summary").asText(null);

                alternatives.add(new RouteAlternativeDTO(distanceKm, minutes, trafficMinutes, summary));
            }

            return alternatives;

        } catch (Exception e) {
            log.warn("Route alternatives lookup failed: {}", e.getMessage());
            return List.of();
        }
    }

    @Override
    public List<RouteAlternativeDTO> estimateRouteAlternatives(String originAddress, String destinationAddress) {
        try {
            Optional<GeoPoint> origin = geocode(originAddress);
            Optional<GeoPoint> destination = geocode(destinationAddress);

            if (origin.isEmpty() || destination.isEmpty()) {
                return List.of();
            }

            return getRouteAlternatives(origin.get(), destination.get());

        } catch (Exception e) {
            log.warn("Route alternatives estimation failed for '{}' -> '{}': {}",
                    originAddress, destinationAddress, e.getMessage());
            return List.of();
        }
    }

    private boolean isConfigured() {
        if (apiKey == null || apiKey.isBlank()) {
            log.debug("Google Maps API key is not configured (GOOGLE_MAPS_API_KEY env var unset) - skipping call.");
            return false;
        }
        return true;
    }
}
