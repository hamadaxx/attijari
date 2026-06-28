package com.attijari.growth.service;

import com.attijari.growth.model.EntrepreneurProfile;
import com.attijari.growth.model.ScoringEvent;
import com.attijari.growth.repository.EntrepreneurProfileRepository;
import com.attijari.growth.repository.ScoringEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class ScoringService {

    private final EntrepreneurProfileRepository profileRepository;
    private final ScoringEventRepository scoringEventRepository;
    private final ScoringConfigService scoringConfigService;
    private final NotificationService notificationService;

    public ScoringService(EntrepreneurProfileRepository profileRepository,
                          ScoringEventRepository scoringEventRepository,
                          ScoringConfigService scoringConfigService,
                          @Lazy NotificationService notificationService) {
        this.profileRepository = profileRepository;
        this.scoringEventRepository = scoringEventRepository;
        this.scoringConfigService = scoringConfigService;
        this.notificationService = notificationService;
    }

    /**
     * Core scoring method.
     * Points are resolved from the active ScoringConfig (US 2.2a).
     * The caller may pass a custom points value (e.g. absence penalty varies);
     * pass 0 to use the config weight for the event type.
     *
     * After updating the score, checks whether the pre-qualification threshold
     * has just been crossed and fires Fund Manager notifications (US 2.2b).
     */
    public void applyScore(String userId, ScoringEvent.ScoringEventType type,
                           int points, String referenceId, String description) {

        // Resolve points from active config when caller passes 0
        final int resolvedPoints;
        if (points == 0) {
            Map<String, Integer> weights = scoringConfigService.getActiveWeights();
            resolvedPoints = weights.getOrDefault(type.name(), 0);
        } else {
            resolvedPoints = points;
        }

        ScoringEvent event = ScoringEvent.of(userId, type, resolvedPoints, referenceId, description);
        scoringEventRepository.save(event);

        profileRepository.findByUserId(userId).ifPresent(profile -> {
            int previousScore = profile.getIntelligenceScore();
            int newScore = Math.max(0, previousScore + resolvedPoints);
            profile.setIntelligenceScore(newScore);
            profile.setLastActivityAt(java.time.LocalDateTime.now());
            profileRepository.save(profile);

            log.info("Score updated for user {}: {} -> {} ({})", userId, previousScore, newScore, type);

            // US 2.2b – Notify Fund Managers when a startup crosses the threshold
            checkAndNotifyThreshold(profile, previousScore, newScore);
        });
    }

    private void checkAndNotifyThreshold(EntrepreneurProfile profile, int previousScore, int newScore) {
        int threshold = scoringConfigService.getActiveThreshold();
        if (previousScore < threshold && newScore >= threshold) {
            log.info("Startup {} crossed pre-qualification threshold ({} -> {})",
                    profile.getId(), previousScore, newScore);
            notificationService.notifyFundManagersThresholdCrossed(profile);
        }
    }

    public List<ScoringEvent> getHistory(String userId) {
        return scoringEventRepository.findByUserIdOrderByOccurredAtDesc(userId);
    }

    public int getCurrentScore(String userId) {
        return profileRepository.findByUserId(userId)
                .map(EntrepreneurProfile::getIntelligenceScore)
                .orElse(0);
    }

    public long countRecentNoShows(String userId) {
        return scoringEventRepository.countByUserIdAndType(
                userId, ScoringEvent.ScoringEventType.EVENT_ABSENCE_PENALTY);
    }
}
