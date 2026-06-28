package com.attijari.growth.controller;

import com.attijari.growth.dto.request.ProfileRequest;
import com.attijari.growth.dto.request.ProfileValidationRequest;
import com.attijari.growth.model.EntrepreneurProfile;
import com.attijari.growth.model.ScoringEvent;
import com.attijari.growth.repository.UserRepository;
import com.attijari.growth.service.ProfileService;
import com.attijari.growth.service.ScoringService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/profiles")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;
    private final ScoringService scoringService;
    private final UserRepository userRepository;

    // ── Entrepreneur endpoints ──────────────────────────────────────────────

    @PostMapping
    @PreAuthorize("hasRole('ENTREPRENEUR')")
    public ResponseEntity<EntrepreneurProfile> createProfile(
            @AuthenticationPrincipal UserDetails principal,
            @Valid @RequestBody ProfileRequest request) {

        String userId = getUserId(principal);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(profileService.createProfile(userId, request));
    }

    @PutMapping("/me")
    @PreAuthorize("hasRole('ENTREPRENEUR')")
    public ResponseEntity<EntrepreneurProfile> updateProfile(
            @AuthenticationPrincipal UserDetails principal,
            @Valid @RequestBody ProfileRequest request) {

        String userId = getUserId(principal);
        return ResponseEntity.ok(profileService.updateProfile(userId, request));
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('ENTREPRENEUR')")
    public ResponseEntity<EntrepreneurProfile> getMyProfile(
            @AuthenticationPrincipal UserDetails principal) {

        return ResponseEntity.ok(profileService.getByUserId(getUserId(principal)));
    }

    @GetMapping("/me/score-history")
    @PreAuthorize("hasRole('ENTREPRENEUR')")
    public ResponseEntity<List<ScoringEvent>> getMyScoreHistory(
            @AuthenticationPrincipal UserDetails principal) {

        return ResponseEntity.ok(scoringService.getHistory(getUserId(principal)));
    }

    // ── Community Manager endpoints ─────────────────────────────────────────

    @GetMapping("/pending")
    @PreAuthorize("hasRole('COMMUNITY_MANAGER')")
    public ResponseEntity<List<EntrepreneurProfile>> getPendingProfiles() {
        return ResponseEntity.ok(profileService.getPendingProfiles());
    }

    @GetMapping("/approved")
    @PreAuthorize("hasAnyRole('COMMUNITY_MANAGER', 'FUND_MANAGER')")
    public ResponseEntity<List<EntrepreneurProfile>> getApprovedProfiles() {
        return ResponseEntity.ok(profileService.getApprovedProfiles());
    }

    @PatchMapping("/{profileId}/validate")
    @PreAuthorize("hasRole('COMMUNITY_MANAGER')")
    public ResponseEntity<EntrepreneurProfile> validateProfile(
            @PathVariable String profileId,
            @AuthenticationPrincipal UserDetails principal,
            @Valid @RequestBody ProfileValidationRequest request) {

        String cmUserId = getUserId(principal);
        return ResponseEntity.ok(profileService.validateProfile(profileId, cmUserId, request));
    }

    @GetMapping("/{profileId}")
    @PreAuthorize("hasAnyRole('COMMUNITY_MANAGER', 'FUND_MANAGER')")
    public ResponseEntity<EntrepreneurProfile> getProfileById(@PathVariable String profileId) {
        return ResponseEntity.ok(profileService.getById(profileId));
    }

    // US-DASH-02: members inactive 14–28 days (CM work queue)
    @GetMapping("/inactive")
    @PreAuthorize("hasRole('COMMUNITY_MANAGER')")
    public ResponseEntity<List<EntrepreneurProfile>> getInactiveProfiles() {
        LocalDateTime to   = LocalDateTime.now().minusDays(14);
        LocalDateTime from = LocalDateTime.now().minusDays(28);
        return ResponseEntity.ok(profileService.getInactiveProfiles(from, to));
    }

    // ── Helper ─────────────────────────────────────────────────────────────

    private String getUserId(UserDetails principal) {
        return userRepository.findByEmail(principal.getUsername())
                .orElseThrow()
                .getId();
    }
}
