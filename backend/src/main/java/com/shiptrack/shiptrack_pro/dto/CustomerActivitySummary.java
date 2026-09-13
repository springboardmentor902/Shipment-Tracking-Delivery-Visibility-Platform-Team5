package com.shiptrack.shiptrack_pro.dto;

import lombok.*;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerActivitySummary {
    private long distinctCustomerCount;
    private List<CustomerActivityEntry> topCustomers;
}
