package com.attijari.growth.controller;

import com.attijari.growth.model.MarketIntelligence;
import com.attijari.growth.repository.UserRepository;
import com.attijari.growth.service.MarketIntelligenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/market-intelligence")
@RequiredArgsConstructor
public class MarketIntelligenceController {

    private final MarketIntelligenceService service;
    private final UserRepository userRepository;

    @GetMapping
    @PreAuthorize("hasRole('ENTREPRENEUR')")
    public ResponseEntity<?> search(
            @AuthenticationPrincipal UserDetails principal,
            @RequestParam MarketIntelligence.MarketCategory categorie,
            @RequestParam(defaultValue = "true") boolean filtrerTunisie,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(required = false) MarketIntelligence.NiveauPotentiel niveauPotentiel) {
        try {
            String userId = userRepository.findByEmail(principal.getUsername())
                    .orElseThrow().getId();
            return ResponseEntity.ok(service.search(userId, categorie, filtrerTunisie, q, page, niveauPotentiel));
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode())
                    .body(Map.of("message", e.getReason() != null ? e.getReason() : "Erreur API"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of("message", "Erreur Veille Marché : " + e.getMessage()));
        }
    }
}
