package com.shiptrack.shiptrack_pro.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shiptrack.shiptrack_pro.security.JwtAuthFilter;
import lombok.RequiredArgsConstructor;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;

import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableMethodSecurity
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // Provides ObjectMapper for GoogleMapsService
    @Bean
    public ObjectMapper objectMapper() {
        return new ObjectMapper();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration =
                new CorsConfiguration();

        configuration.setAllowedOrigins(
                List.of("http://localhost:3000")
        );

        configuration.setAllowedMethods(
                List.of(
                        "GET",
                        "POST",
                        "PUT",
                        "PATCH",
                        "DELETE",
                        "OPTIONS"
                )
        );

        configuration.setAllowedHeaders(
                List.of("*")
        );

        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration(
                "/**",
                configuration
        );

        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http) throws Exception {

        http
            .csrf(csrf -> csrf.disable())

            .cors(cors -> cors.configurationSource(
                    corsConfigurationSource()
            ))

            .sessionManagement(session ->
                    session.sessionCreationPolicy(
                            SessionCreationPolicy.STATELESS
                    )
            )

            .authorizeHttpRequests(auth -> auth

                    .requestMatchers(
                            HttpMethod.OPTIONS,
                            "/**"
                    ).permitAll()

                    .requestMatchers(
                            "/api/auth/**"
                    ).permitAll()

                    .requestMatchers(
                            HttpMethod.GET,
                            "/api/shipments/distance"
                    ).permitAll()

                    .requestMatchers(
                            HttpMethod.POST,
                            "/api/shipments"
                    ).hasAnyRole(
                            "CUSTOMER",
                            "BUSINESS_CLIENT"
                    )

                    .requestMatchers(
                            HttpMethod.PUT,
                            "/api/users/*/profile"
                    ).authenticated()

                    .requestMatchers(
                            HttpMethod.PATCH,
                            "/api/users/*/status"
                    ).hasAnyRole(
                            "LOGISTICS_OPERATOR",
                            "ADMINISTRATOR"
                    )

                    // Tracking management
                    .requestMatchers(
                            "/api/tracking/**"
                    ).hasAnyRole(
                            "LOGISTICS_OPERATOR",
                            "ADMINISTRATOR"
                    )

                    // Route viewing: all authenticated users
                    .requestMatchers(
                            HttpMethod.GET,
                            "/api/routes/**"
                    ).authenticated()

                    // Route creation: operator/admin only
                    .requestMatchers(
                            HttpMethod.POST,
                            "/api/routes/**"
                    ).hasAnyRole(
                            "LOGISTICS_OPERATOR",
                            "ADMINISTRATOR"
                    )

                    // Route updates: operator/admin only
                    .requestMatchers(
                            HttpMethod.PUT,
                            "/api/routes/**"
                    ).hasAnyRole(
                            "LOGISTICS_OPERATOR",
                            "ADMINISTRATOR"
                    )

                    .requestMatchers(
                            HttpMethod.PATCH,
                            "/api/routes/**"
                    ).hasAnyRole(
                            "LOGISTICS_OPERATOR",
                            "ADMINISTRATOR"
                    )

                    .requestMatchers(
                            HttpMethod.POST,
                            "/api/pod/**"
                    ).hasRole(
                            "LOGISTICS_OPERATOR"
                    )

                    .requestMatchers(
                            "/api/analytics/**",
                            "/api/reports/**"
                    ).hasAnyRole(
                            "BUSINESS_CLIENT",
                            "ADMINISTRATOR"
                    )

                    .requestMatchers(
                            HttpMethod.POST,
                            "/api/eta/**"
                    ).permitAll()

                    .requestMatchers(
                            HttpMethod.GET,
                            "/api/eta/**"
                    ).authenticated()

                    .requestMatchers(
                            "/api/admin/**"
                    ).hasRole(
                            "ADMINISTRATOR"
                    )

                    .anyRequest().authenticated()
            )

            .httpBasic(basic -> basic.disable())

            .formLogin(form -> form.disable())

            .addFilterBefore(
                    jwtAuthFilter,
                    UsernamePasswordAuthenticationFilter.class
            );

        return http.build();
    }
}