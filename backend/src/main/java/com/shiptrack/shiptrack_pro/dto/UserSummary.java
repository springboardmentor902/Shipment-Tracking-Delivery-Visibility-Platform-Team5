package com.shiptrack.shiptrack_pro.dto;

import lombok.*;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSummary {
    private long totalUsers;
    private Map<String, Long> usersByRole;
    private long activeUsers;
    private long inactiveUsers;
}
