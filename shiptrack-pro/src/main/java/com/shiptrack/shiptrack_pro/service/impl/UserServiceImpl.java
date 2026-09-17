package com.shiptrack.shiptrack_pro.service.impl;

import com.shiptrack.shiptrack_pro.dto.LoginRequest;
import com.shiptrack.shiptrack_pro.dto.LoginResponse;
import com.shiptrack.shiptrack_pro.dto.RegisterRequest;
import com.shiptrack.shiptrack_pro.dto.UserResponse;
import com.shiptrack.shiptrack_pro.entity.User;
import com.shiptrack.shiptrack_pro.repository.UserRepository;
import com.shiptrack.shiptrack_pro.security.JwtUtil;
import com.shiptrack.shiptrack_pro.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;


    // =========================================================
    // REGISTER
    // =========================================================

    @Override
    public UserResponse registerUser(RegisterRequest request) {

        if (userRepository.existsByEmail(request.getEmail())) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Email already registered: "
                            + request.getEmail()
            );
        }


        // =====================================================
        // Validate selected role
        // =====================================================

        String role = request.getRole();

        if (role == null || role.trim().isEmpty()) {

            role = "CUSTOMER";
        }

        role = role.trim().toUpperCase();


        Set<String> allowedRoles = Set.of(
                "CUSTOMER",
                "ADMIN",
                "LOGISTICS_OPERATOR"
        );


        if (!allowedRoles.contains(role)) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid role: " + role
            );
        }


        // =====================================================
        // Create user
        // =====================================================

        User user = User.builder()

                .fullName(
                        request.getFullName()
                )

                .email(
                        request.getEmail()
                )

                .password(
                        passwordEncoder.encode(
                                request.getPassword()
                        )
                )

                .phone(
                        request.getPhone()
                )

                .role(
                        role
                )

                .status(
                        "ACTIVE"
                )

                .build();


        User savedUser =
                userRepository.save(user);


        return mapToResponse(savedUser);
    }


    // =========================================================
    // LOGIN
    // =========================================================

    @Override
    public LoginResponse loginUser(
            LoginRequest request) {

        User user =
                userRepository.findByEmail(
                        request.getEmail()
                ).orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.UNAUTHORIZED,
                                "Invalid email or password"
                        )
                );


        if (!passwordEncoder.matches(
                request.getPassword(),
                user.getPassword())) {

            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Invalid email or password"
            );
        }


        if (!"ACTIVE".equals(user.getStatus())) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Account is not active. Current status: "
                            + user.getStatus()
            );
        }


        user.setLastLoginAt(
                LocalDateTime.now()
        );


        User updatedUser =
                userRepository.save(user);


        String token =
                jwtUtil.generateToken(
                        updatedUser.getEmail(),
                        updatedUser.getRole()
                );


        return LoginResponse.builder()

                .token(token)

                .tokenType("Bearer")

                .user(
                        mapToResponse(
                                updatedUser
                        )
                )

                .build();
    }


    // =========================================================
    // USER RESPONSE
    // =========================================================

    private UserResponse mapToResponse(
            User user) {

        return UserResponse.builder()

                .id(
                        user.getId()
                )

                .fullName(
                        user.getFullName()
                )

                .email(
                        user.getEmail()
                )

                .phone(
                        user.getPhone()
                )

                .role(
                        user.getRole()
                )

                .status(
                        user.getStatus()
                )

                .createdAt(
                        user.getCreatedAt()
                )

                .build();
    }
}