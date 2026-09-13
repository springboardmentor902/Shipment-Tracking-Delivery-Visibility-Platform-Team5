package com.shiptrack.shiptrack_pro.service;

import com.shiptrack.shiptrack_pro.dto.BusinessAccountRequest;
import com.shiptrack.shiptrack_pro.dto.BusinessAccountResponse;

public interface BusinessAccountService {
    BusinessAccountResponse createForCurrentUser(String email, BusinessAccountRequest request);
    BusinessAccountResponse getForCurrentUser(String email);
}
