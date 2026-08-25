package com.shiptrack.shiptrack_pro.service;

import com.shiptrack.shiptrack_pro.entity.BusinessAccount;
import com.shiptrack.shiptrack_pro.entity.User;
import com.shiptrack.shiptrack_pro.repository.BusinessAccountRepository;
import com.shiptrack.shiptrack_pro.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class BusinessAccountService {

    private final BusinessAccountRepository businessAccountRepository;
    private final UserRepository userRepository;

    public BusinessAccount createBusinessAccount(Long userId) {

        if (businessAccountRepository.existsByUserId(userId)) {
            throw new RuntimeException(
                    "Business account already exists for this user"
            );
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new RuntimeException("User not found")
                );

        BusinessAccount account = BusinessAccount.builder()
                .user(user)
                .build();

        return businessAccountRepository.save(account);
    }
}