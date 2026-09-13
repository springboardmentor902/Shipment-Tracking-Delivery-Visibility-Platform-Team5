package com.shiptrack.shiptrack_pro.controller;

import com.shiptrack.shiptrack_pro.dto.BusinessAccountRequest;
import com.shiptrack.shiptrack_pro.dto.BusinessAccountResponse;
import com.shiptrack.shiptrack_pro.security.CurrentUser;
import com.shiptrack.shiptrack_pro.service.BusinessAccountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/** User Management Module (PDF 4.2) - business account creation for BUSINESS_CLIENT users. */
@RestController
@RequestMapping("/api/business-accounts")
@RequiredArgsConstructor
public class BusinessAccountController {

    private final BusinessAccountService businessAccountService;
    private final CurrentUser currentUser;

    @PostMapping
    public ResponseEntity<BusinessAccountResponse> create(@Valid @RequestBody BusinessAccountRequest request) {
        BusinessAccountResponse response = businessAccountService.createForCurrentUser(currentUser.email(), request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/me")
    public ResponseEntity<BusinessAccountResponse> getMine() {
        return ResponseEntity.ok(businessAccountService.getForCurrentUser(currentUser.email()));
    }
}
