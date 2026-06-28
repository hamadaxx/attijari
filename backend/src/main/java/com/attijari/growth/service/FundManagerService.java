package com.attijari.growth.service;

import com.attijari.growth.dto.response.StartupScoreView;
import com.attijari.growth.model.EntrepreneurProfile;
import com.attijari.growth.model.ScoringEvent;
import com.attijari.growth.repository.EntrepreneurProfileRepository;
import com.attijari.growth.repository.EventRepository;
import com.attijari.growth.repository.PublicationRepository;
import com.attijari.growth.repository.ScoringEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FundManagerService {

    private final EntrepreneurProfileRepository profileRepository;
    private final ScoringEventRepository scoringEventRepository;
    private final EventRepository eventRepository;
    private final PublicationRepository publicationRepository;
    private final ScoringConfigService scoringConfigService;

    /**
     * US 2.1a Scenario 1 – Returns only startups whose score exceeds the
     * pre-qualification threshold defined in the active ScoringConfig.
     * Optional filters: sector, location, min score override.
     */
    public List<StartupScoreView> getPrequalifiedStartups(
            String sector, String location, Integer minScoreOverride) {

        int threshold = minScoreOverride != null
                ? minScoreOverride
                : scoringConfigService.getActiveThreshold();

        return profileRepository.findByStatus(EntrepreneurProfile.ProfileStatus.APPROVED)
                .stream()
                .filter(p -> p.getIntelligenceScore() >= threshold)
                .filter(p -> sector == null || sector.isBlank()
                        || sector.equalsIgnoreCase(p.getBusinessSector()))
                .filter(p -> location == null || location.isBlank()
                        || (p.getLocation() != null
                            && p.getLocation().toLowerCase().contains(location.toLowerCase())))
                .map(this::toScoreView)
                .sorted((a, b) -> Integer.compare(b.getIntelligenceScore(), a.getIntelligenceScore()))
                .toList();
    }

    /**
     * US 2.1a Scenario 2 – Detailed view including 90-day score evolution
     * and community interaction count.
     */
    private StartupScoreView toScoreView(EntrepreneurProfile profile) {
        String userId = profile.getUserId();
        LocalDateTime cutoff = LocalDateTime.now().minusDays(90);

        // 90-day score delta: sum of scoring events in the last 90 days
        int evolution90 = scoringEventRepository
                .findByUserIdOrderByOccurredAtDesc(userId)
                .stream()
                .filter(e -> e.getOccurredAt().isAfter(cutoff))
                .mapToInt(ScoringEvent::getPoints)
                .sum();

        // Community interactions = event attendances + approved publications
        int events = eventRepository.findByAttendedUserIdsContaining(userId).size();
        int publications = publicationRepository.findByAuthorId(userId).stream()
                .filter(pub -> pub.getStatus().name().equals("PUBLISHED"))
                .toList()
                .size();

        return StartupScoreView.builder()
                .profileId(profile.getId())
                .userId(userId)
                .companyName(profile.getCompanyName())
                .businessSector(profile.getBusinessSector())
                .developmentStage(profile.getDevelopmentStage())
                .location(profile.getLocation())
                .linkedinUrl(profile.getLinkedinUrl())
                .intelligenceScore(profile.getIntelligenceScore())
                .scoreEvolution90Days(evolution90)
                .communityInteractionCount(events + publications)
                .mentorRecommendationCount(0) // populated in Sprint 5 (Venture Studio)
                .profileApprovedAt(profile.getValidatedAt())
                .build();
    }
}
