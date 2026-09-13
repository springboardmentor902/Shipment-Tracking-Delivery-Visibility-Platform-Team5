package com.shiptrack.shiptrack_pro.config;

import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

/**
 * Shared HTTP client for outbound calls to third-party services (Google Maps, etc).
 *
 * Uses setConnectTimeout/setReadTimeout rather than the newer connectTimeout/readTimeout
 * names, because this project pins spring-boot-starter-parent to 3.3.4 (see pom.xml) and
 * the unprefixed names were only added in Spring Boot 3.4.0. If you upgrade the parent
 * version past 3.4.0, setConnectTimeout/setReadTimeout still work (deprecated, removal
 * planned for 4.0.0) but you may want to switch to connectTimeout/readTimeout then.
 */
@Configuration
public class RestClientConfig {

    @Bean
    public RestTemplate restTemplate(RestTemplateBuilder builder) {
        return builder
                .setConnectTimeout(Duration.ofSeconds(5))
                .setReadTimeout(Duration.ofSeconds(5))
                .build();
    }
}
