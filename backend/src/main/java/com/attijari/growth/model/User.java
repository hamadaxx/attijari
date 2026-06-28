package com.attijari.growth.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.HashSet;

@Data
@NoArgsConstructor
@Document(collection = "users")
public class User {

    @Id
    private String id;

    @Indexed(unique = true)
    private String email;

    private String password;

    private String firstName;

    private String lastName;

    private String phone;

    private Set<String> roles = new HashSet<>(); // ENTREPRENEUR, MENTOR, COMMUNITY_MANAGER, FUND_MANAGER

    private boolean active = true;

    // ── Mentor fields (US 1.2b) ─────────────────────────────────────────────
    private Double mentorAverageRating;
    private int mentorRatingCount = 0;
    private boolean mentorFlagged = false;

    // ── Fund Manager notification preferences (US 2.2b Scenario 2) ─────────
    private java.util.List<String> sectorInterests = new java.util.ArrayList<>();

    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime updatedAt = LocalDateTime.now();
}
