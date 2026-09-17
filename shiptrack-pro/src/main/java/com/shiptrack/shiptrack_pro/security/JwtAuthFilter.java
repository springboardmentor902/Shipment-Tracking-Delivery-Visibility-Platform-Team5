package com.shiptrack.shiptrack_pro.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final CustomUserDetailsService userDetailsService;

    @Override
    protected boolean shouldNotFilter(
            HttpServletRequest request) {

        String path = request.getServletPath();

        // Do not run JWT authentication for login/registration
        if (path.startsWith("/api/auth/")) {
            return true;
        }

        // Do not run JWT authentication for CORS preflight
        if ("OPTIONS".equalsIgnoreCase(
                request.getMethod())) {

            return true;
        }

        return false;
    }


    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader =
                request.getHeader("Authorization");


        // =====================================================
        // CHECK AUTHORIZATION HEADER
        // =====================================================

        if (authHeader == null
                || !authHeader.startsWith("Bearer ")) {

            System.out.println(
                    "JWT FILTER: No Bearer token found"
            );

            filterChain.doFilter(
                    request,
                    response
            );

            return;
        }


        // =====================================================
        // EXTRACT TOKEN
        // =====================================================

        String token =
                authHeader.substring(7);


        try {

            // =================================================
            // EXTRACT EMAIL FROM TOKEN
            // =================================================

            String email =
                    jwtUtil.extractEmail(token);


            System.out.println(
                    "JWT FILTER: Email from token = "
                            + email
            );


            // =================================================
            // CHECK IF USER IS ALREADY AUTHENTICATED
            // =================================================

            if (email != null
                    && SecurityContextHolder
                    .getContext()
                    .getAuthentication() == null) {


                // =============================================
                // LOAD USER FROM DATABASE
                // =============================================

                UserDetails userDetails =
                        userDetailsService
                                .loadUserByUsername(email);


                System.out.println(
                        "JWT FILTER: User found = "
                                + userDetails.getUsername()
                );


                System.out.println(
                        "JWT FILTER: User authorities = "
                                + userDetails.getAuthorities()
                );


                // =============================================
                // VALIDATE TOKEN
                // =============================================

                boolean valid =
                        jwtUtil.isTokenValid(
                                token,
                                userDetails.getUsername()
                        );


                System.out.println(
                        "JWT FILTER: Token valid = "
                                + valid
                );


                if (valid) {

                    // =========================================
                    // CREATE AUTHENTICATION
                    // =========================================

                    UsernamePasswordAuthenticationToken
                            authentication =
                            new UsernamePasswordAuthenticationToken(
                                    userDetails,
                                    null,
                                    userDetails.getAuthorities()
                            );


                    // =========================================
                    // SET SECURITY CONTEXT
                    // =========================================

                    SecurityContextHolder
                            .getContext()
                            .setAuthentication(
                                    authentication
                            );


                    System.out.println(
                            "JWT FILTER: Authentication set successfully"
                    );

                } else {

                    System.out.println(
                            "JWT FILTER: Token is INVALID"
                    );
                }
            }


        } catch (Exception e) {

            System.out.println(
                    "JWT FILTER ERROR: "
                            + e.getMessage()
            );

            e.printStackTrace();

            SecurityContextHolder
                    .clearContext();
        }


        // =====================================================
        // DIAGNOSTIC INFORMATION
        // =====================================================

        System.out.println(
                "REQUEST: "
                        + request.getMethod()
                        + " "
                        + request.getRequestURI()
        );


        System.out.println(
                "AUTHENTICATION: "
                        + SecurityContextHolder
                        .getContext()
                        .getAuthentication()
        );


        if (SecurityContextHolder
                .getContext()
                .getAuthentication() != null) {

            System.out.println(
                    "AUTHORITIES: "
                            + SecurityContextHolder
                            .getContext()
                            .getAuthentication()
                            .getAuthorities()
            );
        }


        // =====================================================
        // CONTINUE REQUEST
        // =====================================================

        filterChain.doFilter(
                request,
                response
        );
    }
}