package com.attijari.growth.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@Document(collection = "entrepreneur_profiles")
public class EntrepreneurProfile {

    @Id
    private String id;

    @Indexed(unique = true)
    private String userId;

    // Core required fields (must all be present for validation)
    private String businessSector;        // e.g. "Fintech", "Agritech"
    private String developmentStage;      // IDEA, MVP, GROWTH, SCALE
    private List<String> priorityNeeds;   // e.g. ["Financement", "Mentorat", "Réseau"]

    // Additional profile info
    private String companyName;
    private String companyDescription;
    private String location;
    private String linkedinUrl;
    private String websiteUrl;

    // Status managed by Community Manager
    private ProfileStatus status = ProfileStatus.PENDING_VALIDATION;
    private String rejectionReason;
    private String cmNotes;               // CM internal notes
    private LocalDateTime validatedAt;
    private String validatedBy;           // CM user id

    // Scoring (= Score d'Engagement, SE — v3 backlog Epic C)
    private int intelligenceScore = 0;
    private LocalDateTime lastActivityAt; // updated on each scoring event

    // KYB status (US-KYC-01 / US-KYC-02)
    private KybStatus kybStatus = KybStatus.NOT_SUBMITTED;
    private String kybDossierId;
    private boolean startupActCertified = false; // true when ANPE number validated

    // Audit
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();

    public enum KybStatus {
        NOT_SUBMITTED,
        SUBMITTED,
        UNDER_REVIEW,
        APPROVED,
        REJECTED,
        INFO_REQUIRED
    }

    public enum ProfileStatus {
        PENDING_VALIDATION,
        APPROVED,
        REJECTED,
        AWAITING_INFO    // CM requested more info — 48h timer paused
    }

    /**
     * US 1.1b: A profile is considered complete (validatable) only when
     * all three mandatory fields are present.
     */
    public boolean isSufficientlyComplete() {
        return businessSector != null && !businessSector.isBlank()
            && developmentStage != null && !developmentStage.isBlank()
            && priorityNeeds != null && !priorityNeeds.isEmpty();
    }
}
