package com.shiptrack.shiptrack_pro.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * Live Delivery Monitoring Module - STOMP-over-WebSocket setup.
 *
 * Endpoint: /api/ws/tracking (registered both as a raw WebSocket and, for browsers/proxies
 * that block raw WS, with a SockJS fallback at the same path).
 *
 * Broker: a simple in-memory broker under /topic. Each shipment gets its own channel,
 * /topic/shipment/{shipmentId}/location, so a client only receives updates for the shipment
 * it subscribed to. /app is reserved for future client-to-server messages (not used yet -
 * the only way location gets in is the POST /api/route/{id}/location REST endpoint).
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/api/ws/tracking")
                .setAllowedOriginPatterns("*");

        // SockJS fallback for environments where a raw WebSocket connection is blocked.
        registry.addEndpoint("/api/ws/tracking")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic");
        registry.setApplicationDestinationPrefixes("/app");
    }
}
