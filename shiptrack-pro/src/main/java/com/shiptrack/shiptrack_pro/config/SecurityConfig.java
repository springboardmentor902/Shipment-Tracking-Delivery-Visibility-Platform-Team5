package com.shiptrack.shiptrack_pro.config;

import java.util.List;

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
import org.springframework.web.filter.CorsFilter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shiptrack.shiptrack_pro.security.JwtAuthFilter;

import lombok.RequiredArgsConstructor;

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
    public CorsFilter corsFilter() {
        return new CorsFilter(corsConfigurationSource());
    }


    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration =
                new CorsConfiguration();

        configuration.setAllowedOrigins(
                List.of("http://localhost:3000", "https://shiptrack-frontend.vercel.app")
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

                // Disable CSRF because the application uses JWT authentication.
                .csrf(csrf -> csrf.disable())

                // Enable CORS for the frontend application.
                .cors(cors ->
                        cors.configurationSource(
                                corsConfigurationSource()
                        )
                )

                // Use stateless authentication with JWT.
                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // Authentication endpoints are publicly accessible.
                        .requestMatchers(
                                "/api/auth/**"
                        )
                        .permitAll()

                        // WebSocket tracking connections are publicly accessible.
                        .requestMatchers(
                                "/ws/tracking/**"
                        )
                        .permitAll()

                        // Distance calculation is publicly accessible.
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/shipments/distance"
                        )
                        .permitAll()

                        // Customers and Business Clients can create shipments.
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/shipments"
                        )
                        .hasAnyRole(
                                "CUSTOMER",
                                "BUSINESS_CLIENT"
                        )

                        // Authenticated users can read shipment information.
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/shipments/**"
                        )
                        .authenticated()

                        // Authenticated users can update their profile.
                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/users/*/profile"
                        )
                        .authenticated()

                        // Only operational/support/admin roles can change user status.
                        .requestMatchers(
                                HttpMethod.PATCH,
                                "/api/users/*/status"
                        )
                        .hasAnyRole(
                                "LOGISTICS_OPERATOR",
                                "SUPPORT_AGENT",
                                "ADMINISTRATOR"
                        )

                        // Authenticated users can view tracking history.
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/tracking/**"
                        )
                        .authenticated()

                        // Only Logistics Operators and Admins can create tracking events.
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/tracking/**"
                        )
                        .hasAnyRole(
                                "LOGISTICS_OPERATOR",
                                "ADMINISTRATOR"
                        )

                        // Logistics Operators and Admins can update live driver locations.
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/routes/*/location"
                        )
                        .hasAnyRole(
                                "LOGISTICS_OPERATOR",
                                "ADMINISTRATOR"
                        )

                        // Route history is available to authenticated users.
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/routes/*/history"
                        )
                        .authenticated()

                        // Authenticated users can read current route information.
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/routes/**"
                        )
                        .authenticated()

                        // Only Logistics Operators and Admins can create routes.
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/routes/**"
                        )
                        .hasAnyRole(
                                "LOGISTICS_OPERATOR",
                                "ADMINISTRATOR"
                        )

                        // Only Logistics Operators and Admins can update routes.
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

                        // Authenticated users can access shipment packages.
                        .requestMatchers(
                                "/api/shipments/*/packages"
                        )
                        .authenticated()

                        // Only Logistics Operators can submit proof of delivery.
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/pod/**"
                        )
                        .hasRole(
                                "LOGISTICS_OPERATOR"
                        )

                        // Support Agents and Admins can verify proof of delivery.
                        .requestMatchers(
                                HttpMethod.PATCH,
                                "/api/pod/*/verify"
                        )
                        .hasAnyRole(
                                "SUPPORT_AGENT",
                                "ADMINISTRATOR"
                        )

                        // Authenticated users can access POD.
                        // Ownership is validated inside ProofOfDeliveryService.
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/pod/**"
                        )
                        .authenticated()

                        // Customer can access only customer analytics.
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/analytics/customer"
                        )
                        .hasRole(
                                "CUSTOMER"
                        )

                        // Business Client can access only business analytics.
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/analytics/business"
                        )
                        .hasRole(
                                "BUSINESS_CLIENT"
                        )

                        // Admin can access platform-wide analytics.
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/analytics/admin"
                        )
                        .hasRole(
                                "ADMINISTRATOR"
                        )

                        // Admin-only route analytics if exposed separately.
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/analytics/routes"
                        )
                        .hasRole(
                                "ADMINISTRATOR"
                        )

                        // Customer, Business Client and Admin can generate reports.
                        // Ownership and data scope are validated in ReportBuildingService.
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/reports/**"
                        )
                        .hasAnyRole(
                                "CUSTOMER",
                                "BUSINESS_CLIENT",
                                "ADMINISTRATOR"
                        )

                        // ETA prediction endpoints.
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

                        // Only Admins can access admin endpoints.
                        .requestMatchers(
                                "/api/admin/**"
                        )
                        .hasRole(
                                "ADMINISTRATOR"
                        )

                        // All remaining endpoints require authentication.
                        .anyRequest()
                        .authenticated()
                )

                // Disable HTTP Basic authentication.
                .httpBasic(basic ->
                        basic.disable()
                )

                // Disable form-based login because JWT is used.
                .formLogin(form ->
                        form.disable()
                )

                // Add JWT authentication before the default username/password filter.
                .addFilterBefore(
                        jwtAuthFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }
}