package com.attijari.growth.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@Document(collection = "scoring_events")
public class ScoringEvent {

    @Id
    private String id;

    private String userId;

    private ScoringEventType type;

    private int points; // positive = gain, negative = penalty

    private String referenceId; // id of the entity that triggered this (publication, event, etc.)

    private String description;

    private LocalDateTime occurredAt = LocalDateTime.now();

    public enum ScoringEventType {
        PROFILE_CREATED,           // +10
        EVENT_ATTENDED,            // +10
        EVENT_ABSENCE_PENALTY,     // -5 (3 consecutive no-shows)
        PUBLICATION_APPROVED,      // +5
        PUBLICATION_BONUS,         // +10 (>20 reactions)
        PUBLICATION_PLAGIARISM,    // -15
        VENTURE_STUDIO_DELIVERABLE,// +15  (Sprint 5)
        KYB_VALIDATED,             // +20 (US-KYC-02)
        KYB_STARTUP_ACT            // +20 (US-KYC-01 bonus — ANPE certified)
    }

    public static ScoringEvent of(String userId, ScoringEventType type, int points,
                                  String referenceId, String description) {
        ScoringEvent event = new ScoringEvent();
        event.setUserId(userId);
        event.setType(type);
        event.setPoints(points);
        event.setReferenceId(referenceId);
        event.setDescription(description);
        return event;
    }
}
