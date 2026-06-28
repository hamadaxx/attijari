package com.attijari.growth.service;

import com.attijari.growth.dto.request.ProfileRequest;
import com.attijari.growth.dto.request.ProfileValidationRequest;
import com.attijari.growth.exception.BadRequestException;
import com.attijari.growth.exception.NotFoundException;
import com.attijari.growth.model.EntrepreneurProfile;
import com.attijari.growth.model.ScoringEvent;
import com.attijari.growth.model.User;
import com.attijari.growth.repository.EntrepreneurProfileRepository;
import com.attijari.growth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProfileService {

    private final EntrepreneurProfileRepository profileRepository;
    private final UserRepository userRepository;
    private final ScoringService scoringService;

    /**
     * US 1.1a – Entrepreneur creates their profile
     */
    public EntrepreneurProfile createProfile(String userId, ProfileRequest request) {
        if (profileRepository.findByUserId(userId).isPresent()) {
            throw new BadRequestException("Un profil existe déjà pour cet utilisateur.");
        }

        EntrepreneurProfile profile = new EntrepreneurProfile();
        profile.setUserId(userId);
        profile.setBusinessSector(request.getBusinessSector());
        profile.setDevelopmentStage(request.getDevelopmentStage());
        profile.setPriorityNeeds(request.getPriorityNeeds());
        profile.setCompanyName(request.getCompanyName());
        profile.setCompanyDescription(request.getCompanyDescription());
        profile.setLocation(request.getLocation());
        profile.setLinkedinUrl(request.getLinkedinUrl());
        profile.setWebsiteUrl(request.getWebsiteUrl());
        profile.setStatus(EntrepreneurProfile.ProfileStatus.PENDING_VALIDATION);

        return profileRepository.save(profile);
    }

    /**
     * US 1.1a – Update own profile
     */
    public EntrepreneurProfile updateProfile(String userId, ProfileRequest request) {
        EntrepreneurProfile profile = profileRepository.findByUserId(userId)
                .orElseThrow(() -> new NotFoundException("Profil non trouvé."));

        profile.setBusinessSector(request.getBusinessSector());
        profile.setDevelopmentStage(request.getDevelopmentStage());
        profile.setPriorityNeeds(request.getPriorityNeeds());
        profile.setCompanyName(request.getCompanyName());
        profile.setCompanyDescription(request.getCompanyDescription());
        profile.setLocation(request.getLocation());
        profile.setLinkedinUrl(request.getLinkedinUrl());
        profile.setWebsiteUrl(request.getWebsiteUrl());
        profile.setUpdatedAt(LocalDateTime.now());

        // If rejected before, re-submitting moves back to PENDING
        if (profile.getStatus() == EntrepreneurProfile.ProfileStatus.REJECTED) {
            profile.setStatus(EntrepreneurProfile.ProfileStatus.PENDING_VALIDATION);
        }

        return profileRepository.save(profile);
    }

    /**
     * US 1.1b – Community Manager validates or rejects a profile
     */
    public EntrepreneurProfile validateProfile(String profileId, String cmUserId,
                                               ProfileValidationRequest request) {
        EntrepreneurProfile profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new NotFoundException("Profil non trouvé."));

        boolean shouldScore = false;

        switch (request.getAction()) {
            case APPROVE -> {
                // US 1.1b Scenario 1: block validation if profile is incomplete
                if (!profile.isSufficientlyComplete()) {
                    throw new BadRequestException(
                        "Impossible de valider un profil incomplet (secteur, stade et besoins obligatoires).");
                }
                profile.setStatus(EntrepreneurProfile.ProfileStatus.APPROVED);
                profile.setValidatedAt(LocalDateTime.now());
                profile.setValidatedBy(cmUserId);
                shouldScore = true;
            }
            case REJECT -> {
                // US 1.1b Scenario 3: rejection must have a written explanation
                if (request.getReason() == null || request.getReason().isBlank()) {
                    throw new BadRequestException(
                        "Une explication écrite est obligatoire lors d'un rejet.");
                }
                profile.setStatus(EntrepreneurProfile.ProfileStatus.REJECTED);
                profile.setRejectionReason(request.getReason());
            }
            case REQUEST_INFO -> {
                // US 1.1b Scenario 2: pauses the 48h timer
                if (request.getReason() == null || request.getReason().isBlank()) {
                    throw new BadRequestException("Précisez les informations demandées.");
                }
                profile.setStatus(EntrepreneurProfile.ProfileStatus.AWAITING_INFO);
                profile.setCmNotes(request.getReason());
            }
        }

        profile.setUpdatedAt(LocalDateTime.now());
        profileRepository.save(profile); // persist status changes first

        if (shouldScore) {
            // US 1.1a Scenario 1: award 10 initial scoring points on approval.
            // applyScore re-fetches the profile internally — must run AFTER the status save
            // so the score update lands on top of the already-persisted APPROVED status.
            scoringService.applyScore(
                profile.getUserId(),
                ScoringEvent.ScoringEventType.PROFILE_CREATED,
                10,
                profile.getId(),
                "Profil validé par le Community Manager"
            );
            // Re-fetch so the caller sees the correct score (not the stale 0)
            return profileRepository.findById(profileId).orElseThrow();
        }

        return profile;
    }

    public EntrepreneurProfile getByUserId(String userId) {
        return profileRepository.findByUserId(userId)
                .orElseThrow(() -> new NotFoundException("Profil non trouvé."));
    }

    public EntrepreneurProfile getById(String profileId) {
        return profileRepository.findById(profileId)
                .orElseThrow(() -> new NotFoundException("Profil non trouvé."));
    }

    public List<EntrepreneurProfile> getPendingProfiles() {
        return profileRepository.findByStatus(EntrepreneurProfile.ProfileStatus.PENDING_VALIDATION);
    }

    public List<EntrepreneurProfile> getApprovedProfiles() {
        return profileRepository.findByStatus(EntrepreneurProfile.ProfileStatus.APPROVED);
    }

    public List<EntrepreneurProfile> getInactiveProfiles(java.time.LocalDateTime from, java.time.LocalDateTime to) {
        return profileRepository.findByStatusAndLastActivityAtBetween(
                EntrepreneurProfile.ProfileStatus.APPROVED, from, to);
    }
}
