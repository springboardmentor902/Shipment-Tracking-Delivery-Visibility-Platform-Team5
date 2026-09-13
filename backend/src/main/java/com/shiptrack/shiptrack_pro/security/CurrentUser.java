package com.shiptrack.shiptrack_pro.security;

import com.shiptrack.shiptrack_pro.entity.User;
import com.shiptrack.shiptrack_pro.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

/** Small helper controllers use to resolve the authenticated User behind the current JWT. */
@Component
@RequiredArgsConstructor
public class CurrentUser {

    private final UserRepository userRepository;

    public String email() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    public User get() {
        return userRepository.findByEmail(email())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }

    public Long id() {
        return get().getId();
    }
}
