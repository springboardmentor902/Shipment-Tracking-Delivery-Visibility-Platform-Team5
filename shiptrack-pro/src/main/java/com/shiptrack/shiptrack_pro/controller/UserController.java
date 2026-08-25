package com.shiptrack.shiptrack_pro.controller;

import com.shiptrack.shiptrack_pro.dto.ProfileUpdateRequest;
import com.shiptrack.shiptrack_pro.dto.UserResponse;
import com.shiptrack.shiptrack_pro.service.UserService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // Update own profile
    @PutMapping("/{id}/profile")
    public ResponseEntity<UserResponse> updateProfile(
            @PathVariable Long id,
            @RequestBody ProfileUpdateRequest request) {

        return ResponseEntity.ok(
                userService.updateProfile(id, request)
        );
    }

    // Update user status - operator/admin
    @PatchMapping("/{id}/status")
    public ResponseEntity<UserResponse> updateStatus(
            @PathVariable Long id,
            @RequestParam String status) {

        return ResponseEntity.ok(
                userService.updateUserStatus(id, status)
        );
    }
}