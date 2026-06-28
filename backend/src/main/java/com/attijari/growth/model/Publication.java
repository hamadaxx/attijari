package com.attijari.growth.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@Document(collection = "publications")
public class Publication {

    @Id
    private String id;

    private String authorId;

    private String authorName;

    private String title;

    private String content;

    private String sector; // sector tag for relevance

    private PublicationStatus status = PublicationStatus.PENDING_EDITORIAL;

    // Moderation
    private String archiveReason;       // US 1.3b: reason when archived
    private String archivedBy;          // CM user id
    private LocalDateTime archivedAt;

    // Reactions from validated members
    private List<String> reactedUserIds = new ArrayList<>();  // user ids who reacted

    // Plagiarism reports (US 1.3a Scenario 3)
    private List<String> plagiarismReporterIds = new ArrayList<>();
    private boolean plagiarismValidated = false;

    // Points tracking
    private int basePointsAwarded = 0;     // 5 points on publication
    private int bonusPointsAwarded = 0;    // +10 if > 20 reactions
    private int penaltyPoints = 0;         // -15 if plagiarism confirmed

    private LocalDateTime publishedAt;
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();

    public enum PublicationStatus {
        PENDING_EDITORIAL,  // awaiting CM review
        PUBLISHED,
        ARCHIVED,           // US 1.3b: hidden but not deleted
        REMOVED_PLAGIARISM  // removed due to confirmed plagiarism
    }

    public int getReactionCount() {
        return reactedUserIds != null ? reactedUserIds.size() : 0;
    }

    public int getPlagiarismReportCount() {
        return plagiarismReporterIds != null ? plagiarismReporterIds.size() : 0;
    }
}
