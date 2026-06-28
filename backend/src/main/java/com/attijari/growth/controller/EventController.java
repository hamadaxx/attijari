package com.attijari.growth.controller;

import com.attijari.growth.dto.request.EventRequest;
import com.attijari.growth.model.Event;
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

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;
    private final UserRepository userRepository;

    // ── Public / Entrepreneur ───────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<List<Event>> getUpcomingEvents() {
        return ResponseEntity.ok(eventService.getUpcomingEvents());
    }

    @GetMapping("/{eventId}")
    public ResponseEntity<Event> getEvent(@PathVariable String eventId) {
        return ResponseEntity.ok(eventService.getById(eventId));
    }

    @PostMapping("/{eventId}/register")
    @PreAuthorize("hasRole('ENTREPRENEUR')")
    public ResponseEntity<Event> register(
            @PathVariable String eventId,
            @AuthenticationPrincipal UserDetails principal) {

        return ResponseEntity.ok(eventService.registerForEvent(eventId, getUserId(principal)));
    }

    @DeleteMapping("/{eventId}/register")
    @PreAuthorize("hasRole('ENTREPRENEUR')")
    public ResponseEntity<Event> cancelRegistration(
            @PathVariable String eventId,
            @AuthenticationPrincipal UserDetails principal) {

        return ResponseEntity.ok(eventService.cancelRegistration(eventId, getUserId(principal)));
    }

    @GetMapping("/my-registrations")
    @PreAuthorize("hasRole('ENTREPRENEUR')")
    public ResponseEntity<List<Event>> getMyRegistrations(
            @AuthenticationPrincipal UserDetails principal) {

        return ResponseEntity.ok(eventService.getUserRegistrations(getUserId(principal)));
    }

    // ── Mentor ──────────────────────────────────────────────────────────────

    @PostMapping
    @PreAuthorize("hasAnyRole('MENTOR', 'COMMUNITY_MANAGER')")
    public ResponseEntity<Event> createEvent(
            @AuthenticationPrincipal UserDetails principal,
            @Valid @RequestBody EventRequest request) {

        String userId = getUserId(principal);
        boolean isMentor = principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_MENTOR"));

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(eventService.createEvent(userId, request, isMentor));
    }

    // ── Community Manager ────────────────────────────────────────────────────

    @PatchMapping("/{eventId}/validate")
    @PreAuthorize("hasRole('COMMUNITY_MANAGER')")
    public ResponseEntity<Event> validateEvent(
            @PathVariable String eventId,
            @AuthenticationPrincipal UserDetails principal) {

        return ResponseEntity.ok(eventService.validateEvent(eventId, getUserId(principal)));
    }

    @PostMapping("/{eventId}/attendance")
    @PreAuthorize("hasRole('COMMUNITY_MANAGER')")
    public ResponseEntity<Void> processAttendance(
            @PathVariable String eventId,
            @RequestBody List<String> attendedUserIds) {

        eventService.processEventAttendance(eventId, attendedUserIds);
        return ResponseEntity.ok().build();
    }

    // ── Helper ─────────────────────────────────────────────────────────────

    private String getUserId(UserDetails principal) {
        return userRepository.findByEmail(principal.getUsername())
                .orElseThrow().getId();
    }
}
