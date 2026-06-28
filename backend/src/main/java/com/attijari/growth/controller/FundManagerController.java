package com.attijari.growth.controller;

import com.attijari.growth.dto.response.StartupScoreView;
import com.attijari.growth.model.EntrepreneurProfile;
import com.attijari.growth.model.ScoringEvent;
import com.attijari.growth.model.User;
import com.attijari.growth.repository.UserRepository;
import com.attijari.growth.service.FundManagerService;
import com.attijari.growth.service.ProfileService;
import com.attijari.growth.service.ScoringService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/fund")
@RequiredArgsConstructor
@PreAuthorize("hasRole('FUND_MANAGER')")
public class FundManagerController {

    private final FundManagerService fundManagerService;
    private final ProfileService profileService;
    private final ScoringService scoringService;
    private final UserRepository userRepository;

    /**
     * US 2.1a Scenario 1 & 3 – Pre-qualified startups above threshold.
     * Supports optional filters: sector, location, minScore.
     */
    @GetMapping("/startups")
    public ResponseEntity<List<StartupScoreView>> getPrequalifiedStartups(
            @RequestParam(required = false) String sector,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) Integer minScore) {

        return ResponseEntity.ok(fundManagerService.getPrequalifiedStartups(sector, location, minScore));
    }

    /**
     * US 2.1a Scenario 2 – Full profile detail of a single startup
     */
    @GetMapping("/startups/{profileId}")
    public ResponseEntity<EntrepreneurProfile> getStartupDetail(@PathVariable String profileId) {
        return ResponseEntity.ok(profileService.getById(profileId));
    }

    /**
     * Score history for a specific startup (used in the detail view)
     */
    @GetMapping("/startups/{profileId}/score-history")
    public ResponseEntity<List<ScoringEvent>> getScoreHistory(@PathVariable String profileId) {
        EntrepreneurProfile profile = profileService.getById(profileId);
        return ResponseEntity.ok(scoringService.getHistory(profile.getUserId()));
    }

    /**
     * US 2.2b Scenario 2 – Update Fund Manager sector interests for notification filtering
     */
    @PatchMapping("/preferences/sectors")
    public ResponseEntity<Void> updateSectorInterests(
            @AuthenticationPrincipal UserDetails principal,
            @RequestBody List<String> sectorInterests) {

        User user = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        user.setSectorInterests(sectorInterests);
        userRepository.save(user);
        return ResponseEntity.ok().build();
    }
}
