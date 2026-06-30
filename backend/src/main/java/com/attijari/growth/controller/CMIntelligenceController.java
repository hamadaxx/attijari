package com.attijari.growth.controller;

import com.attijari.growth.model.MarketIntelligence;
import com.attijari.growth.model.MarketIntelligence.NiveauPotentiel;
import com.attijari.growth.service.MarketIntelligenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cm/intelligence")
@RequiredArgsConstructor
public class CMIntelligenceController {

    private final MarketIntelligenceService service;

    @GetMapping
    @PreAuthorize("hasRole('COMMUNITY_MANAGER')")
    public ResponseEntity<?> topStartups(
            @RequestParam(defaultValue = "ALL") String secteur,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(required = false) MarketIntelligence.NiveauPotentiel niveauPotentiel) {
        try {
            return ResponseEntity.ok(service.searchTopStartups(secteur, page, niveauPotentiel));
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode())
                    .body(Map.of("message", e.getReason() != null ? e.getReason() : "Erreur API"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of("message", "Erreur Intelligence : " + e.getMessage()));
        }
    }
}
