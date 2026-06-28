package com.attijari.growth.controller;

import com.attijari.growth.dto.request.EventRatingRequest;
import com.attijari.growth.dto.request.EventRequest;
import com.attijari.growth.model.Event;
import com.attijari.growth.model.User;
import com.attijari.growth.repository.UserRepository;
import com.attijari.growth.service.EventService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/mentor")
@RequiredArgsConstructor
public class MentorController {

    private final EventService eventService;
    private final UserRepository userRepository;

    /**
     * US 1.2b Scenario 1 – Mentor proposes a webinar; goes to CM for validation.
     */
    @PostMapping("/events")
    @PreAuthorize("hasRole('MENTOR')")
    public ResponseEntity<Event> proposeWebinar(
            @AuthenticationPrincipal UserDetails principal,
            @Valid @RequestBody EventRequest request) {

        String mentorId = getUserId(principal);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(eventService.createEvent(mentorId, request, true));
    }

    /** All events organized by this mentor */
    @GetMapping("/events")
    @PreAuthorize("hasRole('MENTOR')")
    public ResponseEntity<List<Event>> getMyEvents(
            @AuthenticationPrincipal UserDetails principal) {

        return ResponseEntity.ok(eventService.getMentorEvents(getUserId(principal)));
    }

    /**
     * US 1.2b Scenario 2 – Attendee rates a completed webinar (1–5).
     * Entrepreneurs call this endpoint after an event ends.
     */
    @PostMapping("/events/{eventId}/rate")
    @PreAuthorize("hasRole('ENTREPRENEUR')")
    public ResponseEntity<Event> rateEvent(
            @PathVariable String eventId,
            @AuthenticationPrincipal UserDetails principal,
            @Valid @RequestBody EventRatingRequest request) {

        String userId = getUserId(principal);
        return ResponseEntity.ok(eventService.rateEvent(eventId, userId, request.getRating()));
    }

    /**
     * Mentor's public profile with average rating
     */
    @GetMapping("/{mentorId}/profile")
    public ResponseEntity<Map<String, Object>> getMentorProfile(@PathVariable String mentorId) {
        User mentor = userRepository.findById(mentorId)
                .orElseThrow();
        return ResponseEntity.ok(Map.of(
            "id", mentor.getId(),
            "firstName", mentor.getFirstName(),
            "lastName", mentor.getLastName(),
            "averageRating", mentor.getMentorAverageRating() != null ? mentor.getMentorAverageRating() : 0.0,
            "ratingCount", mentor.getMentorRatingCount(),
            "flagged", mentor.isMentorFlagged()
        ));
    }

    private String getUserId(UserDetails principal) {
        return userRepository.findByEmail(principal.getUsername()).orElseThrow().getId();
    }
}
