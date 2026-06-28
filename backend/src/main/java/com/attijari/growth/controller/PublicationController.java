package com.attijari.growth.controller;

import com.attijari.growth.dto.request.PublicationRequest;
import com.attijari.growth.model.Publication;
import com.attijari.growth.repository.UserRepository;
import com.attijari.growth.service.PublicationService;
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
@RequestMapping("/api/publications")
@RequiredArgsConstructor
public class PublicationController {

    private final PublicationService publicationService;
    private final UserRepository userRepository;

    // ── Public ──────────────────────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<List<Publication>> getPublishedPublications() {
        return ResponseEntity.ok(publicationService.getPublishedPublications());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Publication> getPublication(@PathVariable String id) {
        return ResponseEntity.ok(publicationService.getById(id));
    }

    // ── Entrepreneur ─────────────────────────────────────────────────────────

    @PostMapping
    @PreAuthorize("hasRole('ENTREPRENEUR')")
    public ResponseEntity<Publication> submitPublication(
            @AuthenticationPrincipal UserDetails principal,
            @Valid @RequestBody PublicationRequest request) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(publicationService.submitPublication(getUserId(principal), request));
    }

    @GetMapping("/mine")
    @PreAuthorize("hasRole('ENTREPRENEUR')")
    public ResponseEntity<List<Publication>> getMyPublications(
            @AuthenticationPrincipal UserDetails principal) {

        return ResponseEntity.ok(publicationService.getMyPublications(getUserId(principal)));
    }

    @PostMapping("/{id}/react")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Publication> react(
            @PathVariable String id,
            @AuthenticationPrincipal UserDetails principal) {

        return ResponseEntity.ok(publicationService.reactToPublication(id, getUserId(principal)));
    }

    @PostMapping("/{id}/report-plagiarism")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Publication> reportPlagiarism(
            @PathVariable String id,
            @AuthenticationPrincipal UserDetails principal) {

        return ResponseEntity.ok(publicationService.reportPlagiarism(id, getUserId(principal)));
    }

    // ── Community Manager ────────────────────────────────────────────────────

    @GetMapping("/pending")
    @PreAuthorize("hasRole('COMMUNITY_MANAGER')")
    public ResponseEntity<List<Publication>> getPendingPublications() {
        return ResponseEntity.ok(publicationService.getPendingPublications());
    }

    @PatchMapping("/{id}/approve")
    @PreAuthorize("hasRole('COMMUNITY_MANAGER')")
    public ResponseEntity<Publication> approvePublication(
            @PathVariable String id,
            @AuthenticationPrincipal UserDetails principal) {

        return ResponseEntity.ok(publicationService.approvePublication(id, getUserId(principal)));
    }

    @PatchMapping("/{id}/archive")
    @PreAuthorize("hasRole('COMMUNITY_MANAGER')")
    public ResponseEntity<Publication> archivePublication(
            @PathVariable String id,
            @AuthenticationPrincipal UserDetails principal,
            @RequestBody Map<String, String> body) {

        String reason = body.get("reason");
        return ResponseEntity.ok(publicationService.archivePublication(id, getUserId(principal), reason));
    }

    // ── Helper ─────────────────────────────────────────────────────────────

    private String getUserId(UserDetails principal) {
        return userRepository.findByEmail(principal.getUsername())
                .orElseThrow().getId();
    }
}
