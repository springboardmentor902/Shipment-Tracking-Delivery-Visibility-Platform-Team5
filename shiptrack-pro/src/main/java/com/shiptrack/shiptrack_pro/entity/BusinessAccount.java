package com.shiptrack.shiptrack_pro.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
    name = "business_accounts",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = "user_id")
    }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BusinessAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(
        name = "user_id",
        nullable = false,
        unique = true
    )
    private User user;
}