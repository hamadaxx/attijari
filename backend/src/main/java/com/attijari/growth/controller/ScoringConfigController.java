package com.attijari.growth.controller;

import com.attijari.growth.dto.request.ScoringConfigApprovalRequest;
import com.attijari.growth.dto.request.ScoringConfigRequest;
import com.attijari.growth.model.ScoringConfig;
import com.attijari.growth.repository.UserRepository;
import com.attijari.growth.service.ScoringConfigService;
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
@RequestMapping("/api/scoring-config")
@RequiredArgsConstructor
public class ScoringConfigController {

    private final ScoringConfigService scoringConfigService;
    private final UserRepository userRepository;

    /** Active config + current weights (anyone authenticated can view) */
    @GetMapping("/active")
    public ResponseEntity<Object> getActive() {
        Object body = scoringConfigService.getActive()
                .<Object>map(c -> c)
                .orElse(Map.of(
                    "weights", ScoringConfigService.DEFAULT_WEIGHTS,
                    "prequalificationThreshold", ScoringConfigService.DEFAULT_PREQUALIFICATION_THRESHOLD,
                    "status", "DEFAULT"
                ));
        return ResponseEntity.ok(body);
    }

    /** Full history (CM only) */
    @GetMapping
    @PreAuthorize("hasRole('COMMUNITY_MANAGER')")
    public ResponseEntity<List<ScoringConfig>> getAll() {
        return ResponseEntity.ok(scoringConfigService.getAll());
    }

    /** Pending approval config (CM only) */
    @GetMapping("/pending")
    @PreAuthorize("hasRole('COMMUNITY_MANAGER')")
    public ResponseEntity<?> getPending() {
        return scoringConfigService.getPending()
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    /** US 2.2a – CM proposes a new scoring config */
    @PostMapping
    @PreAuthorize("hasRole('COMMUNITY_MANAGER')")
    public ResponseEntity<ScoringConfig> propose(
            @AuthenticationPrincipal UserDetails principal,
            @Valid @RequestBody ScoringConfigRequest request) {

        String cmUserId = getUserId(principal);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(scoringConfigService.propose(cmUserId, request));
    }

    /** US 2.2a – CM submits their draft for supervisor review */
    @PatchMapping("/{configId}/submit")
    @PreAuthorize("hasRole('COMMUNITY_MANAGER')")
    public ResponseEntity<ScoringConfig> submit(
            @PathVariable String configId,
            @AuthenticationPrincipal UserDetails principal) {

        return ResponseEntity.ok(scoringConfigService.submitForApproval(getUserId(principal), configId));
    }

    /** US 2.2a Scenario 1 – Supervisor approves (double-regard: different CM user) */
    @PatchMapping("/{configId}/approve")
    @PreAuthorize("hasRole('COMMUNITY_MANAGER')")
    public ResponseEntity<ScoringConfig> approve(
            @PathVariable String configId,
            @AuthenticationPrincipal UserDetails principal,
            @RequestBody ScoringConfigApprovalRequest request) {

        return ResponseEntity.ok(scoringConfigService.approve(getUserId(principal), configId, request));
    }

    /** US 2.2a – Supervisor rejects the proposed config */
    @PatchMapping("/{configId}/reject")
    @PreAuthorize("hasRole('COMMUNITY_MANAGER')")
    public ResponseEntity<ScoringConfig> reject(
            @PathVariable String configId,
            @AuthenticationPrincipal UserDetails principal,
            @RequestBody ScoringConfigApprovalRequest request) {

        return ResponseEntity.ok(scoringConfigService.reject(getUserId(principal), configId, request));
    }

    private String getUserId(UserDetails principal) {
        return userRepository.findByEmail(principal.getUsername()).orElseThrow().getId();
    }
}
