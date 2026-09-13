package com.shiptrack.shiptrack_pro.config;

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

/**
 * The RBAC rulebook. @EnableMethodSecurity switches on @PreAuthorize across the whole
 * project, and authorizeHttpRequests maps each of the five roles to the parts of the API
 * they're allowed to reach, evaluated top to bottom.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity // activates @PreAuthorize on controller methods
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                    .requestMatchers("/files/**").permitAll()
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui.html").permitAll()
                // WebSocket handshake (+ SockJS info/transport sub-paths) for live tracking.
                // Left public so the unauthenticated public tracking page (/api/shipments/track/**
                // above) can also subscribe to a shipment's location channel; the topic name
                // itself (shipment id) is the only thing gating what a client can see.
                .requestMatchers("/api/ws/tracking/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/shipments")
                    .hasAnyRole("CUSTOMER", "BUSINESS_CLIENT")
                .requestMatchers(HttpMethod.PUT, "/api/shipments/*/cancel")
                    .hasAnyRole("CUSTOMER", "BUSINESS_CLIENT", "ADMINISTRATOR")
                .requestMatchers(HttpMethod.GET, "/api/shipments/track/**")
                    .permitAll()
                // GET is public so the anonymous public tracking page can read route info
                // (origin/destination/last known location) to render the live map, matching
                // GET /api/shipments/track/** above. Planning/completing a route stays
                // restricted to staff.
                .requestMatchers(HttpMethod.GET, "/api/routes/**")
                    .permitAll()
                .requestMatchers(HttpMethod.POST, "/api/routes/**")
                    .hasAnyRole("LOGISTICS_OPERATOR", "ADMINISTRATOR")
                .requestMatchers(HttpMethod.PUT, "/api/routes/**")
                    .hasAnyRole("LOGISTICS_OPERATOR", "ADMINISTRATOR")
                .requestMatchers("/api/tracking/**")
                    .hasAnyRole("LOGISTICS_OPERATOR", "ADMINISTRATOR")
                .requestMatchers(HttpMethod.POST, "/api/route/*/location")
                    .hasAnyRole("LOGISTICS_OPERATOR", "ADMINISTRATOR")
                .requestMatchers(HttpMethod.POST, "/api/pod/**")
                    .hasRole("LOGISTICS_OPERATOR")
                // Also enforced via @PreAuthorize on the controller method itself - this
                // URL-level rule is belt-and-braces so the restriction is visible here too,
                // not just in the controller.
                .requestMatchers(HttpMethod.PUT, "/api/pod/*/verify")
                    .hasAnyRole("ADMINISTRATOR", "SUPPORT_AGENT")
                .requestMatchers(HttpMethod.PATCH, "/api/pod/*/verify")
                    .hasAnyRole("ADMINISTRATOR", "SUPPORT_AGENT")
                .requestMatchers(HttpMethod.GET, "/api/pod/**")
                    .authenticated()
                // GET is open to any authenticated user - CUSTOMER included, since the ETA
                // widget on their own shipment's detail page needs this (previously
                // excluded CUSTOMER entirely, which would have 403'd that widget).
                // Triggering a recalculation stays restricted to staff/business roles.
                .requestMatchers(HttpMethod.GET, "/api/eta/**")
                    .authenticated()
                .requestMatchers(HttpMethod.POST, "/api/eta/**")
                    .hasAnyRole("LOGISTICS_OPERATOR", "BUSINESS_CLIENT", "ADMINISTRATOR")
                // Role-specific restriction now happens per-endpoint via @PreAuthorize
                // (AnalyticsController, ReportController) since CUSTOMER needs access to
                // its own analytics/reports too - the old blanket BUSINESS_CLIENT/
                // ADMINISTRATOR-only rule here would have 403'd every customer.
                .requestMatchers("/api/analytics/**", "/api/reports/**")
                    .authenticated()
                // Manual staff-triggered notifications - distinct from /api/notifications/**
                // (plural, the logged-in user's own notification center) below, which falls
                // through to anyRequest().authenticated() since any user may read/mark-read
                // their own notifications.
                .requestMatchers(HttpMethod.POST, "/api/notification")
                    .hasAnyRole("LOGISTICS_OPERATOR", "SUPPORT_AGENT", "ADMINISTRATOR")
                .requestMatchers("/api/business-accounts/**")
                    .hasAnyRole("BUSINESS_CLIENT", "ADMINISTRATOR")
                .requestMatchers("/api/admin/**").hasRole("ADMINISTRATOR")
                .anyRequest().authenticated()
            )
            .httpBasic(basic -> basic.disable())
            .formLogin(form -> form.disable())
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
