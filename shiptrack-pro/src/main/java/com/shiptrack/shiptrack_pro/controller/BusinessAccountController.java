package com.shiptrack.shiptrack_pro.controller;

import com.shiptrack.shiptrack_pro.entity.BusinessAccount;
import com.shiptrack.shiptrack_pro.service.BusinessAccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/business_acc")
@RequiredArgsConstructor
public class BusinessAccountController {

    private final BusinessAccountService businessAccountService;

    @PostMapping
    public ResponseEntity<BusinessAccount> createBusinessAccount(
            @RequestParam Long userId) {

        return ResponseEntity.ok(
                businessAccountService.createBusinessAccount(userId)
        );
    }
}