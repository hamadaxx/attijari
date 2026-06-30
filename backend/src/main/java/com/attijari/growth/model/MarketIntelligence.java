package com.attijari.growth.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@Document(collection = "market_intelligence")
public class MarketIntelligence {

    @Id
    private String id;

    private String title;
    private String snippet;
    private String source;
    private String url;
    private MarketCategory category;
    private LocalDateTime dateAdded = LocalDateTime.now();
    private String startupId;
    private String query;
    private boolean filteredByTunisia;

    // ── Scoring ───────────────────────────────────────────────────────────────
    private int score = 0;
    private NiveauPotentiel niveauPotentiel = NiveauPotentiel.FAIBLE;
    private List<String> criteresDetectes = new ArrayList<>();

    public enum MarketCategory {
        CONCURRENT, FINANCEMENT, ACTUALITE
    }

    public enum NiveauPotentiel {
        ELEVE, MOYEN, FAIBLE
    }
}
