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

    @Bean
    public ObjectMapper objectMapper() {
        return new ObjectMapper().findAndRegisterModules();
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

                        // ==========================================
                        // AUTHENTICATION
                        // ==========================================

                        .requestMatchers("/api/auth/**")
                        .permitAll()


                        // ==========================================
                        // WEBSOCKET
                        // ==========================================

                        .requestMatchers("/ws/tracking/**")
                        .permitAll()


                        // ==========================================
                        // DISTANCE
                        // ==========================================

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/shipments/distance"
                        )
                        .permitAll()


                        // ==========================================
                        // SHIPMENT CREATION
                        // ==========================================

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/shipments"
                        )
                        .hasAnyRole(
                                "CUSTOMER",
                                "BUSINESS_CLIENT"
                        )


                        // ==========================================
                        // SHIPMENT READ
                        // ==========================================

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/shipments/**"
                        )
                        .authenticated()


                        // ==========================================
                        // PROFILE
                        // ==========================================

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/users/*/profile"
                        )
                        .authenticated()


                        // ==========================================
                        // USER STATUS
                        // ==========================================

                        .requestMatchers(
                                HttpMethod.PATCH,
                                "/api/users/*/status"
                        )
                        .hasAnyRole(
                                "LOGISTICS_OPERATOR",
                                "SUPPORT_AGENT",
                                "ADMINISTRATOR"
                        )


                        // ==========================================
                        // TRACKING HISTORY
                        // ==========================================

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/tracking/**"
                        )
                        .authenticated()


                        // ==========================================
                        // TRACKING EVENTS
                        // ==========================================

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/tracking/**"
                        )
                        .hasAnyRole(
                                "LOGISTICS_OPERATOR",
                                "ADMINISTRATOR"
                        )


                        // ==========================================
                        // LIVE DRIVER LOCATION
                        // ==========================================

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/routes/*/location"
                        )
                        .hasAnyRole(
                                "LOGISTICS_OPERATOR",
                                "ADMINISTRATOR"
                        )


                        // ==========================================
                        // ROUTE READ
                        // ==========================================

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/routes/**"
                        )
                        .authenticated()


                        // ==========================================
                        // ROUTE CREATE
                        // ==========================================

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/routes/**"
                        )
                        .hasAnyRole(
                                "LOGISTICS_OPERATOR",
                                "ADMINISTRATOR"
                        )


                        // ==========================================
                        // ROUTE UPDATE
                        // ==========================================

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/routes/**"
                        )
                        .hasAnyRole(
                                "LOGISTICS_OPERATOR",
                                "ADMINISTRATOR"
                        )

                        .requestMatchers(
                                HttpMethod.PATCH,
                                "/api/routes/**"
                        )
                        .hasAnyRole(
                                "LOGISTICS_OPERATOR",
                                "ADMINISTRATOR"
                        )


                        // ==========================================
                        // PACKAGES
                        // ==========================================

                        .requestMatchers(
                                "/api/shipments/*/packages"
                        )
                        .authenticated()


                        // ==========================================
                        // PROOF OF DELIVERY
                        // ==========================================

                        // Operator submits POD
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/pod/**"
                        )
                        .hasRole("LOGISTICS_OPERATOR")


                        // Support Agent/Admin verifies POD
                        .requestMatchers(
                                HttpMethod.PATCH,
                                "/api/pod/*/verify"
                        )
                        .hasAnyRole(
                                "SUPPORT_AGENT",
                                "ADMINISTRATOR"
                        )


                        // Customer/Business Client/Support/Admin
                        // can reach the endpoint.
                        // Actual ownership authorization is checked
                        // inside ProofOfDeliveryService.
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/pod/**"
                        )
                        .authenticated()


                        // ==========================================
                        // ANALYTICS & REPORTS
                        // ==========================================

                        .requestMatchers(
                                "/api/analytics/**",
                                "/api/reports/**"
                        )
                        .hasAnyRole(
                                "BUSINESS_CLIENT",
                                "ADMINISTRATOR"
                        )


                        // ==========================================
                        // ETA
                        // ==========================================

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/eta/**"
                        )
                        .permitAll()

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/eta/**"
                        )
                        .authenticated()


                        // ==========================================
                        // ADMIN
                        // ==========================================

                        .requestMatchers("/api/admin/**")
                        .hasRole("ADMINISTRATOR")


                        // ==========================================
                        // EVERYTHING ELSE
                        // ==========================================

                        .anyRequest()
                        .authenticated()
                )

                .httpBasic(basic ->
                        basic.disable()
                )

                .formLogin(form ->
                        form.disable()
                )

                .addFilterBefore(
                        jwtAuthFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }
}