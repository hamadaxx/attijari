package com.attijari.growth.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@Document(collection = "scoring_configs")
public class ScoringConfig {

    @Id
    private String id;

    // Points per ScoringEventType name (e.g. "PROFILE_CREATED" -> 10)
    private Map<String, Integer> weights;

    // Score threshold above which a startup is pre-qualified (US 2.1a)
    private int prequalificationThreshold = 50;

    private ScoringConfigStatus status = ScoringConfigStatus.DRAFT;

    private String proposedBy;
    private String approvedBy;

    // Business justification required for audit trail (US 2.2a Scenario 3)
    private String justification;

    private LocalDateTime proposedAt = LocalDateTime.now();
    private LocalDateTime approvedAt;

    // Non-retroactive: scores calculated before this date are unaffected (US 2.2a Scenario 2)
    private LocalDateTime effectiveFrom;

    // Immutable audit log (US 2.2a Scenario 3)
    private List<AuditEntry> auditLog = new ArrayList<>();

    @Data
    @NoArgsConstructor
    public static class AuditEntry {
        private String action;   // PROPOSED, SUBMITTED, APPROVED, REJECTED
        private String userId;
        private LocalDateTime timestamp;
        private String note;

        public static AuditEntry of(String action, String userId, String note) {
            AuditEntry entry = new AuditEntry();
            entry.action = action;
            entry.userId = userId;
            entry.timestamp = LocalDateTime.now();
            entry.note = note;
            return entry;
        }
    }

    public enum ScoringConfigStatus {
        DRAFT,
        PENDING_APPROVAL,
        ACTIVE,
        SUPERSEDED,
        REJECTED
    }
}
