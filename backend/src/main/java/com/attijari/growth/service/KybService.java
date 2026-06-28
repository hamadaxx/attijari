package com.attijari.growth.service;

import com.attijari.growth.dto.request.KybRequest;
import com.attijari.growth.dto.request.KybReviewRequest;
import com.attijari.growth.exception.BadRequestException;
import com.attijari.growth.exception.NotFoundException;
import com.attijari.growth.model.EntrepreneurProfile;
import com.attijari.growth.model.KybDossier;
import com.attijari.growth.model.ScoringEvent;
import com.attijari.growth.repository.EntrepreneurProfileRepository;
import com.attijari.growth.repository.KybRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class KybService {

    private final KybRepository kybRepository;
    private final EntrepreneurProfileRepository profileRepository;
    private final ScoringService scoringService;

    // ── Entrepreneur ────────────────────────────────────────────────────────

    public KybDossier submit(String userId, KybRequest request) {
        EntrepreneurProfile profile = profileRepository.findByUserId(userId)
                .orElseThrow(() -> new NotFoundException("Profil introuvable. Créez votre profil communautaire d'abord."));

        if (profile.getStatus() != EntrepreneurProfile.ProfileStatus.APPROVED) {
            throw new BadRequestException("Votre profil communautaire doit être validé avant de soumettre le dossier KYB.");
        }

        if (kybRepository.findByUserId(userId).isPresent()) {
            throw new BadRequestException("Un dossier KYB existe déjà pour ce compte. Contactez le Compliance Officer pour une re-soumission.");
        }

        Set<String> required = Set.of("ACTE_CONSTITUTION", "MATRICULE_FISCAL", "CIN_GERANT", "JUSTIFICATIF_SIEGE");
        if (request.getDocumentFileIds() == null || !request.getDocumentFileIds().keySet().containsAll(required)) {
            throw new BadRequestException("Toutes les pièces justificatives doivent être téléversées avant la soumission (acte de constitution, matricule fiscal, CIN gérant, justificatif de siège).");
        }

        KybDossier dossier = new KybDossier();
        dossier.setUserId(userId);
        dossier.setProfileId(profile.getId());
        dossier.setCompanyName(request.getCompanyName());
        dossier.setLegalForm(request.getLegalForm());
        dossier.setFiscalMatricule(request.getFiscalMatricule());
        dossier.setStartupActNumber(request.getStartupActNumber());
        dossier.setRegisteredAddress(request.getRegisteredAddress());
        dossier.setRepresentativeFullName(request.getRepresentativeFullName());
        dossier.setRepresentativeCin(request.getRepresentativeCin());
        dossier.setDocumentFileIds(request.getDocumentFileIds());
        if (request.getDocumentFileNames() != null) {
            dossier.setDocumentFileNames(request.getDocumentFileNames());
        }
        dossier.setStatus(KybDossier.KybStatus.SUBMITTED);
        dossier.getAuditLog().add(new KybDossier.AuditEntry("SUBMITTED", userId, "Soumission initiale"));

        KybDossier saved = kybRepository.save(dossier);

        profile.setKybStatus(EntrepreneurProfile.KybStatus.SUBMITTED);
        profile.setKybDossierId(saved.getId());
        profileRepository.save(profile);

        log.info("KYB dossier submitted by user {}", userId);
        return saved;
    }

    public KybDossier getMyDossier(String userId) {
        return kybRepository.findByUserId(userId)
                .orElseThrow(() -> new NotFoundException("Aucun dossier KYB trouvé."));
    }

    // ── Compliance Officer / Community Manager ──────────────────────────────

    public List<KybDossier> getPendingDossiers() {
        return kybRepository.findByStatusIn(List.of(
                KybDossier.KybStatus.SUBMITTED, KybDossier.KybStatus.UNDER_REVIEW));
    }

    public List<KybDossier> getAllDossiers() {
        return kybRepository.findAllByOrderBySubmittedAtDesc();
    }

    public KybDossier getById(String dossierId) {
        return kybRepository.findById(dossierId)
                .orElseThrow(() -> new NotFoundException("Dossier KYB introuvable."));
    }

    public KybDossier review(String reviewerUserId, String dossierId, KybReviewRequest request) {
        KybDossier dossier = getById(dossierId);

        if (dossier.getStatus() == KybDossier.KybStatus.APPROVED) {
            throw new BadRequestException("Ce dossier est déjà approuvé.");
        }

        if ((request.getAction() == KybReviewRequest.Action.REJECT
                || request.getAction() == KybReviewRequest.Action.INFO_REQUIRED)
                && (request.getNotes() == null || request.getNotes().isBlank())) {
            throw new BadRequestException("Une explication est obligatoire pour cette décision.");
        }

        // Track what profile changes to apply AFTER scoring (to avoid stale-object overwrite)
        EntrepreneurProfile.KybStatus newKybStatus;
        boolean grantStartupAct = false;

        switch (request.getAction()) {
            case APPROVE -> {
                dossier.setStatus(KybDossier.KybStatus.APPROVED);
                dossier.setComplianceNotes(request.getNotes());
                newKybStatus = EntrepreneurProfile.KybStatus.APPROVED;

                // +20 pts (US-KYC-02) — applyScore saves the profile internally
                scoringService.applyScore(
                        dossier.getUserId(),
                        ScoringEvent.ScoringEventType.KYB_VALIDATED,
                        20,
                        dossier.getId(),
                        "Dossier KYB validé par le Compliance Officer"
                );

                // Additional +20 if Startup Act (ANPE) certified (US-KYC-01)
                if (dossier.getStartupActNumber() != null && !dossier.getStartupActNumber().isBlank()) {
                    grantStartupAct = true;
                    scoringService.applyScore(
                            dossier.getUserId(),
                            ScoringEvent.ScoringEventType.KYB_STARTUP_ACT,
                            20,
                            dossier.getId(),
                            "Badge Startup Act (ANPE) — +20 pts"
                    );
                }

                dossier.getAuditLog().add(new KybDossier.AuditEntry("APPROVED", reviewerUserId, request.getNotes()));
            }
            case REJECT -> {
                dossier.setStatus(KybDossier.KybStatus.REJECTED);
                dossier.setRejectionReason(request.getNotes());
                newKybStatus = EntrepreneurProfile.KybStatus.REJECTED;
                dossier.getAuditLog().add(new KybDossier.AuditEntry("REJECTED", reviewerUserId, request.getNotes()));
            }
            default -> {
                // INFO_REQUIRED
                dossier.setStatus(KybDossier.KybStatus.INFO_REQUIRED);
                dossier.setInfoRequested(request.getNotes());
                newKybStatus = EntrepreneurProfile.KybStatus.INFO_REQUIRED;
                dossier.getAuditLog().add(new KybDossier.AuditEntry("INFO_REQUIRED", reviewerUserId, request.getNotes()));
            }
        }

        dossier.setReviewedAt(LocalDateTime.now());
        dossier.setReviewedBy(reviewerUserId);

        // Re-fetch profile AFTER applyScore so we don't overwrite the updated score
        EntrepreneurProfile profile = profileRepository.findById(dossier.getProfileId())
                .orElseThrow(() -> new NotFoundException("Profil associé introuvable."));
        profile.setKybStatus(newKybStatus);
        if (grantStartupAct) {
            profile.setStartupActCertified(true);
        }
        profileRepository.save(profile);

        return kybRepository.save(dossier);
    }
}
