package com.attijari.growth.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class StartupScoreView {

    private String profileId;
    private String userId;
    private String companyName;
    private String businessSector;
    private String developmentStage;
    private String location;
    private String linkedinUrl;

    private int intelligenceScore;

    // Points gained or lost over the last 90 days (US 2.1a Scenario 2)
    private int scoreEvolution90Days;

    // Total confirmed event attendances + approved publications (US 2.1a Scenario 2)
    private int communityInteractionCount;

    // Number of validated mentor recommendations (US 2.1a – venture studio track)
    private int mentorRecommendationCount;

    private LocalDateTime profileApprovedAt;
}
