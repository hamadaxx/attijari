package com.attijari.growth.service;

import com.attijari.growth.dto.request.ScoringConfigApprovalRequest;
import com.attijari.growth.dto.request.ScoringConfigRequest;
import com.attijari.growth.exception.BadRequestException;
import com.attijari.growth.exception.NotFoundException;
import com.attijari.growth.model.ScoringConfig;
import com.attijari.growth.model.ScoringEvent;
import com.attijari.growth.repository.ScoringConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ScoringConfigService {

    private final ScoringConfigRepository configRepository;

    // Default weights used when no active config exists
    public static final Map<String, Integer> DEFAULT_WEIGHTS;
    static {
        DEFAULT_WEIGHTS = new HashMap<>();
        DEFAULT_WEIGHTS.put(ScoringEvent.ScoringEventType.PROFILE_CREATED.name(),           10);
        DEFAULT_WEIGHTS.put(ScoringEvent.ScoringEventType.EVENT_ATTENDED.name(),            10);
        DEFAULT_WEIGHTS.put(ScoringEvent.ScoringEventType.EVENT_ABSENCE_PENALTY.name(),     -5);
        DEFAULT_WEIGHTS.put(ScoringEvent.ScoringEventType.PUBLICATION_APPROVED.name(),       5);
        DEFAULT_WEIGHTS.put(ScoringEvent.ScoringEventType.PUBLICATION_BONUS.name(),         10);
        DEFAULT_WEIGHTS.put(ScoringEvent.ScoringEventType.PUBLICATION_PLAGIARISM.name(),   -15);
        DEFAULT_WEIGHTS.put(ScoringEvent.ScoringEventType.VENTURE_STUDIO_DELIVERABLE.name(), 15);
        DEFAULT_WEIGHTS.put(ScoringEvent.ScoringEventType.KYB_VALIDATED.name(),             20);
        DEFAULT_WEIGHTS.put(ScoringEvent.ScoringEventType.KYB_STARTUP_ACT.name(),           20);
    }

    public static final int DEFAULT_PREQUALIFICATION_THRESHOLD = 50;

    /**
     * US 2.2a – CM proposes a new scoring configuration.
     * Only one DRAFT or PENDING_APPROVAL config is allowed at a time.
     */
    public ScoringConfig propose(String cmUserId, ScoringConfigRequest request) {
        // Reject if there is already a pending one
        configRepository.findByStatus(ScoringConfig.ScoringConfigStatus.PENDING_APPROVAL)
                .ifPresent(c -> { throw new BadRequestException(
                    "Une configuration est déjà en attente d'approbation. Annulez-la d'abord."); });

        ScoringConfig config = new ScoringConfig();
        config.setWeights(request.getWeights());
        config.setPrequalificationThreshold(request.getPrequalificationThreshold());
        config.setJustification(request.getJustification());
        config.setProposedBy(cmUserId);
        config.setStatus(ScoringConfig.ScoringConfigStatus.DRAFT);
        config.getAuditLog().add(ScoringConfig.AuditEntry.of("PROPOSED", cmUserId, request.getJustification()));

        return configRepository.save(config);
    }

    /**
     * US 2.2a – CM submits their draft for supervisor approval.
     */
    public ScoringConfig submitForApproval(String cmUserId, String configId) {
        ScoringConfig config = getById(configId);

        if (!config.getProposedBy().equals(cmUserId)) {
            throw new BadRequestException("Seul l'auteur de la configuration peut la soumettre.");
        }
        if (config.getStatus() != ScoringConfig.ScoringConfigStatus.DRAFT) {
            throw new BadRequestException("Seule une configuration en état DRAFT peut être soumise.");
        }

        config.setStatus(ScoringConfig.ScoringConfigStatus.PENDING_APPROVAL);
        config.getAuditLog().add(ScoringConfig.AuditEntry.of("SUBMITTED", cmUserId, "Soumis pour approbation"));

        return configRepository.save(config);
    }

    /**
     * US 2.2a Scenario 1 – Supervisor approves the configuration.
     * The approver must be a different user from the proposer (double-regard).
     * Non-retroactive: effectiveFrom = now.
     */
    public ScoringConfig approve(String supervisorUserId, String configId,
                                  ScoringConfigApprovalRequest request) {
        ScoringConfig config = getById(configId);

        if (config.getProposedBy().equals(supervisorUserId)) {
            throw new BadRequestException(
                "Le validateur ne peut pas être le même que l'auteur de la configuration (double regard obligatoire).");
        }
        if (config.getStatus() != ScoringConfig.ScoringConfigStatus.PENDING_APPROVAL) {
            throw new BadRequestException("Seule une configuration en attente d'approbation peut être validée.");
        }

        // Supersede the currently active config
        configRepository.findByStatus(ScoringConfig.ScoringConfigStatus.ACTIVE)
                .ifPresent(active -> {
                    active.setStatus(ScoringConfig.ScoringConfigStatus.SUPERSEDED);
                    configRepository.save(active);
                });

        config.setStatus(ScoringConfig.ScoringConfigStatus.ACTIVE);
        config.setApprovedBy(supervisorUserId);
        config.setApprovedAt(LocalDateTime.now());
        config.setEffectiveFrom(LocalDateTime.now()); // non-retroactive
        config.getAuditLog().add(ScoringConfig.AuditEntry.of(
            "APPROVED", supervisorUserId,
            request.getNote() != null ? request.getNote() : "Approuvé"));

        log.info("Scoring config {} activated by {} with threshold={}",
                configId, supervisorUserId, config.getPrequalificationThreshold());

        return configRepository.save(config);
    }

    /**
     * US 2.2a – Supervisor rejects the proposed configuration.
     */
    public ScoringConfig reject(String supervisorUserId, String configId,
                                 ScoringConfigApprovalRequest request) {
        if (request.getNote() == null || request.getNote().isBlank()) {
            throw new BadRequestException("Une raison de rejet est obligatoire.");
        }

        ScoringConfig config = getById(configId);
        if (config.getStatus() != ScoringConfig.ScoringConfigStatus.PENDING_APPROVAL) {
            throw new BadRequestException("Seule une configuration en attente peut être rejetée.");
        }

        config.setStatus(ScoringConfig.ScoringConfigStatus.REJECTED);
        config.getAuditLog().add(ScoringConfig.AuditEntry.of("REJECTED", supervisorUserId, request.getNote()));

        return configRepository.save(config);
    }

    /**
     * Returns the currently active config's weights, or defaults if none exists.
     */
    public Map<String, Integer> getActiveWeights() {
        return configRepository.findByStatus(ScoringConfig.ScoringConfigStatus.ACTIVE)
                .map(ScoringConfig::getWeights)
                .orElse(DEFAULT_WEIGHTS);
    }

    /**
     * Returns the currently active pre-qualification threshold, or the default.
     */
    public int getActiveThreshold() {
        return configRepository.findByStatus(ScoringConfig.ScoringConfigStatus.ACTIVE)
                .map(ScoringConfig::getPrequalificationThreshold)
                .orElse(DEFAULT_PREQUALIFICATION_THRESHOLD);
    }

    public Optional<ScoringConfig> getActive() {
        return configRepository.findByStatus(ScoringConfig.ScoringConfigStatus.ACTIVE);
    }

    public Optional<ScoringConfig> getPending() {
        return configRepository.findByStatus(ScoringConfig.ScoringConfigStatus.PENDING_APPROVAL);
    }

    public List<ScoringConfig> getAll() {
        return configRepository.findAllByOrderByProposedAtDesc();
    }

    public ScoringConfig getById(String id) {
        return configRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Configuration de scoring introuvable."));
    }
}
