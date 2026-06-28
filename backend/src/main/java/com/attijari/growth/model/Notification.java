package com.attijari.growth.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@Document(collection = "notifications")
public class Notification {

    @Id
    private String id;

    private String recipientUserId;

    private NotificationType type;

    private String title;
    private String message;

    // id of the entity that triggered the notification (profile id, publication id…)
    private String referenceId;

    private boolean read = false;

    // US 2.2b Scenario 3: auto-escalated when unread for > 72h
    private boolean escalated = false;

    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime readAt;

    public enum NotificationType {
        THRESHOLD_CROSSED,      // startup reached pre-qualification score
        PROFILE_PENDING,        // new profile waiting CM review
        CONTENT_MODERATED       // publication archived
    }

    public static Notification thresholdCrossed(String recipientUserId,
                                                String startupName,
                                                int score,
                                                String profileId) {
        Notification n = new Notification();
        n.recipientUserId = recipientUserId;
        n.type = NotificationType.THRESHOLD_CROSSED;
        n.title = "Startup pré-qualifiée : " + startupName;
        n.message = startupName + " a atteint un score Intelligence de " + score
                + " points et franchit le seuil de pré-qualification.";
        n.referenceId = profileId;
        return n;
    }
}
