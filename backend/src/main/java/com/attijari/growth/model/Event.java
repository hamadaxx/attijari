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
@Document(collection = "events")
public class Event {

    @Id
    private String id;

    private String title;

    private String description;

    private EventType type; // WEBINAR, WORKSHOP, MENTORING_SESSION

    private String organizerId; // Mentor or CM user id

    private String organizerName;

    private LocalDateTime startDateTime;

    private LocalDateTime endDateTime;

    private String replayUrl; // Available 30 days after event ends

    private LocalDateTime replayExpiresAt;

    private EventStatus status = EventStatus.UPCOMING;

    // Registrations
    private List<String> registeredUserIds = new ArrayList<>();

    // Attendance confirmed after event
    private List<String> attendedUserIds = new ArrayList<>();

    // Absences: tracks who was registered but didn't attend (no cancellation)
    private List<String> noShowUserIds = new ArrayList<>();

    // Points awarded on attendance
    private int attendancePoints = 10;

    // US 1.2b – Per-user ratings (userId -> 1..5). Average computed on write.
    private Map<String, Integer> ratings = new HashMap<>();
    private Double mentorRating;    // running average
    private int ratingCount;

    // CM validation (for mentor-proposed webinars)
    private boolean cmValidated = false;
    private String cmValidatedBy;

    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();

    public enum EventType {
        WEBINAR, WORKSHOP, MENTORING_SESSION
    }

    public enum EventStatus {
        PENDING_CM_VALIDATION, UPCOMING, ONGOING, COMPLETED, CANCELLED
    }
}
