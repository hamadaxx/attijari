package com.attijari.growth.service;

import com.attijari.growth.model.EntrepreneurProfile;
import com.attijari.growth.model.MarketIntelligence;
import com.attijari.growth.repository.EntrepreneurProfileRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class MarketIntelligenceService {

    private final RestTemplate restTemplate;
    private final EntrepreneurProfileRepository profileRepository;
    private final StartupScoringService scoringService;

    @Value("${serper.api.key:}")
    private String apiKey;

    private static final String SERPER_URL = "https://google.serper.dev/search";

    // ── Inner DTOs pour la réponse Serper ────────────────────────────────────

    @Data
    static class SerperResponse {
        private List<OrganicResult> organic;

        @Data
        static class OrganicResult {
            private String title;
            private String snippet;
            private String link;
            private String displayLink;
        }
    }

    // ── Secteurs pour la vue CM ───────────────────────────────────────────────

    private static final Map<String, String> STARTUP_QUERIES = Map.of(
            "ALL",        "site:crunchbase.com/organization startup Tunisia",
            "FINTECH",    "site:crunchbase.com/organization fintech Tunisia payments mobile banking",
            "HEALTHTECH", "site:crunchbase.com/organization healthtech Tunisia health",
            "ECOMMERCE",  "site:crunchbase.com/organization ecommerce marketplace Tunisia"
    );

    public List<MarketIntelligence> searchTopStartups(String secteur, int page,
                                                       MarketIntelligence.NiveauPotentiel niveauFilter) {
        if (!isConfigured()) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE, "API_NOT_CONFIGURED");
        }
        String query = STARTUP_QUERIES.getOrDefault(
                secteur != null ? secteur.toUpperCase() : "ALL",
                STARTUP_QUERIES.get("ALL"));
        log.info("CM Intelligence — secteur: {}, query: {}, page: {}", secteur, query, page);
        List<MarketIntelligence> results = callSerper(query, null, true, null, page);
        return scoreAndFilter(results, niveauFilter);
    }

    private List<MarketIntelligence> scoreAndFilter(List<MarketIntelligence> results,
                                                     MarketIntelligence.NiveauPotentiel niveauFilter) {
        List<MarketIntelligence> mutable = new java.util.ArrayList<>(results);
        scoringService.scoreAll(mutable);
        mutable.sort((a, b) -> Integer.compare(b.getScore(), a.getScore()));
        if (niveauFilter != null) {
            return mutable.stream()
                    .filter(r -> r.getNiveauPotentiel() == niveauFilter)
                    .toList();
        }
        return mutable;
    }

    // ── API publique ──────────────────────────────────────────────────────────

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    public List<MarketIntelligence> search(String userId,
                                           MarketIntelligence.MarketCategory category,
                                           boolean filtrerTunisie,
                                           String customQuery,
                                           int page,
                                           MarketIntelligence.NiveauPotentiel niveauFilter) {
        if (!isConfigured()) {
            log.warn("Serper API key non configurée — veille marché désactivée.");
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE, "API_NOT_CONFIGURED");
        }

        String query = buildQuery(userId, category, filtrerTunisie, customQuery);
        log.info("Veille marché Serper — query: {}, page: {}", query, page);
        List<MarketIntelligence> results = callSerper(query, category, filtrerTunisie, userId, page);
        return scoreAndFilter(results, niveauFilter);
    }

    // ── Construction de la requête ────────────────────────────────────────────

    private String buildQuery(String userId, MarketIntelligence.MarketCategory category,
                              boolean filtrerTunisie, String customQuery) {
        String tunisie = filtrerTunisie ? " Tunisie" : "";

        if (customQuery != null && !customQuery.isBlank()) {
            return customQuery + tunisie;
        }

        String secteur = getSecteur(userId);
        String secteurPart = (secteur != null && !secteur.isBlank()) ? " " + secteur : "";

        return switch (category) {
            case CONCURRENT ->
                "startups" + secteurPart + " concurrent innovation technologie" + tunisie;
            case FINANCEMENT ->
                "financement investissement startups" + secteurPart + " seed venture capital" + tunisie;
            case ACTUALITE ->
                "actualités économie numérique technologie entreprises" + secteurPart + tunisie;
        };
    }

    private String getSecteur(String userId) {
        if (userId == null) return null;
        return profileRepository.findByUserId(userId)
                .map(EntrepreneurProfile::getBusinessSector)
                .orElse(null);
    }

    // ── Appel Serper.dev ──────────────────────────────────────────────────────

    private List<MarketIntelligence> callSerper(String query,
                                                 MarketIntelligence.MarketCategory category,
                                                 boolean filtrerTunisie,
                                                 String startupId,
                                                 int page) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("X-API-KEY", apiKey);
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> body = filtrerTunisie
                    ? Map.of("q", query, "gl", "tn", "hl", "fr", "num", 10, "page", page)
                    : Map.of("q", query, "hl", "fr", "num", 10, "page", page);

            ResponseEntity<SerperResponse> response = restTemplate.exchange(
                    URI.create(SERPER_URL),
                    HttpMethod.POST,
                    new HttpEntity<>(body, headers),
                    SerperResponse.class);

            SerperResponse res = response.getBody();
            if (res == null || res.getOrganic() == null) {
                return List.of();
            }

            return res.getOrganic().stream()
                    .map(item -> {
                        MarketIntelligence mi = new MarketIntelligence();
                        mi.setId(UUID.randomUUID().toString());
                        mi.setTitle(item.getTitle());
                        mi.setSnippet(item.getSnippet());
                        mi.setSource(item.getDisplayLink() != null
                                ? item.getDisplayLink()
                                : extractDomain(item.getLink()));
                        mi.setUrl(item.getLink());
                        if (category != null) mi.setCategory(category);
                        mi.setDateAdded(LocalDateTime.now());
                        mi.setStartupId(startupId);
                        mi.setQuery(query);
                        mi.setFilteredByTunisia(filtrerTunisie);
                        return mi;
                    })
                    .toList();

        } catch (Exception e) {
            log.error("Erreur Serper API : {}", e.getMessage(), e);
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_GATEWAY,
                    "Erreur Veille Marché : " + e.getMessage());
        }
    }

    private String extractDomain(String url) {
        if (url == null) return "";
        try {
            return new URI(url).getHost();
        } catch (Exception e) {
            return url;
        }
    }
}
