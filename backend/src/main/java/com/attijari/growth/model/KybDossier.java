package com.attijari.growth.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@Document(collection = "kyb_dossiers")
public class KybDossier {

    @Id
    private String id;

    private String profileId;
    private String userId;

    // ── Legal identity ──────────────────────────────────────────────────────
    private String companyName;
    private String legalForm;           // SARL, SA, SAS, EI, etc.
    private String fiscalMatricule;     // INNORPI matricule fiscal
    private String startupActNumber;    // ANPE — optional; triggers badge + +20 pts
    private String registeredAddress;
    private String representativeFullName;
    private String representativeCin;

    // ── Uploaded document file IDs (stored in kyb_documents collection) ──────
    // Keys: ACTE_CONSTITUTION | MATRICULE_FISCAL | CIN_GERANT | JUSTIFICATIF_SIEGE
    private Map<String, String> documentFileIds = new HashMap<>();
    // Corresponding original file names (for display without re-fetching)
    private Map<String, String> documentFileNames = new HashMap<>();

    // ── Workflow ────────────────────────────────────────────────────────────
    private KybStatus status = KybStatus.SUBMITTED;
    private String complianceNotes;   // CO internal notes (not exposed to entrepreneur)
    private String rejectionReason;   // shown to entrepreneur on rejection
    private String infoRequested;     // shown when INFO_REQUIRED

    private LocalDateTime submittedAt = LocalDateTime.now();
    private LocalDateTime reviewedAt;
    private String reviewedBy;        // CM/CO user id

    private List<AuditEntry> auditLog = new ArrayList<>();

    public enum KybStatus {
        SUBMITTED,
        UNDER_REVIEW,
        APPROVED,
        REJECTED,
        INFO_REQUIRED
    }

    @Data
    @NoArgsConstructor
    public static class AuditEntry {
        private String action;
        private String userId;
        private LocalDateTime timestamp = LocalDateTime.now();
        private String note;

        public AuditEntry(String action, String userId, String note) {
            this.action = action;
            this.userId = userId;
            this.note = note;
        }
    }

    private static final java.util.Set<String> REQUIRED_DOC_TYPES = java.util.Set.of(
            "ACTE_CONSTITUTION", "MATRICULE_FISCAL", "CIN_GERANT", "JUSTIFICATIF_SIEGE");

    public boolean isComplete() {
        return documentFileIds != null
                && documentFileIds.keySet().containsAll(REQUIRED_DOC_TYPES)
                && fiscalMatricule != null && !fiscalMatricule.isBlank()
                && representativeCin != null && !representativeCin.isBlank();
    }
}
