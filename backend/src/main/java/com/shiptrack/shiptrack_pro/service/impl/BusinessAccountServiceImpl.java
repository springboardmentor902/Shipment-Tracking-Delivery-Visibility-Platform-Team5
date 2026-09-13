package com.shiptrack.shiptrack_pro.service.impl;

import com.shiptrack.shiptrack_pro.dto.BusinessAccountRequest;
import com.shiptrack.shiptrack_pro.dto.BusinessAccountResponse;
import com.shiptrack.shiptrack_pro.entity.BusinessAccount;
import com.shiptrack.shiptrack_pro.entity.User;
import com.shiptrack.shiptrack_pro.repository.BusinessAccountRepository;
import com.shiptrack.shiptrack_pro.repository.UserRepository;
import com.shiptrack.shiptrack_pro.service.BusinessAccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class BusinessAccountServiceImpl implements BusinessAccountService {

    private final BusinessAccountRepository businessAccountRepository;
    private final UserRepository userRepository;

    @Override
    public BusinessAccountResponse createForCurrentUser(String email, BusinessAccountRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (businessAccountRepository.existsByUserId(user.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "A business account already exists for this user.");
        }

        BusinessAccount account = BusinessAccount.builder()
                .userId(user.getId())
                .companyName(request.getCompanyName())
                .gstNumber(request.getGstNumber())
                .businessAddress(request.getBusinessAddress())
                .industryType(request.getIndustryType())
                .build();

        return mapToResponse(businessAccountRepository.save(account));
    }

    @Override
    public BusinessAccountResponse getForCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        BusinessAccount account = businessAccountRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "No business account found for this user."));

        return mapToResponse(account);
    }

    private BusinessAccountResponse mapToResponse(BusinessAccount account) {
        return BusinessAccountResponse.builder()
                .id(account.getId())
                .userId(account.getUserId())
                .companyName(account.getCompanyName())
                .gstNumber(account.getGstNumber())
                .businessAddress(account.getBusinessAddress())
                .industryType(account.getIndustryType())
                .createdAt(account.getCreatedAt())
                .build();
    }
}
