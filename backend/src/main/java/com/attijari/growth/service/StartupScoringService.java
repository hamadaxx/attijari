package com.attijari.growth.service;

import com.attijari.growth.model.MarketIntelligence;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Slf4j
public class StartupScoringService {

    record Critere(String label, int points, String... keywords) {}

    private static final List<Critere> CRITERES = List.of(
        new Critere("Startup Act ✓",   30, "startup act", "anpe"),
        new Critere("Financement ✓",   25, "levee de fonds", "financement", "investissement", "funding", "seed", "series a", "venture", "amorcage"),
        new Critere("Croissance ✓",    20, "croissance", "expansion", "scale", "scaling", "hypercroissance"),
        new Critere("International ✓", 15, "international", "export", "maghreb", "europe", "afrique", "global"),
        new Critere("Innovation ✓",    10, "innovation", "technologie", "digital", "numerique", " ia ", " ai ", "intelligence artificielle", "machine learning"),
        new Critere("Récompense ✓",    10, "award", "prix", "laureat", "concours", "winner", "recompense"),
        new Critere("Partenariat ✓",   10, "partenariat", "accord", "deal", "collaboration", "mou")
    );

    public void scoreAll(List<MarketIntelligence> results) {
        results.forEach(this::scoreOne);

        // Bonus popularité : +5 par résultat supplémentaire pour le même domaine (max +20)
        Map<String, Long> sourceCount = results.stream()
                .filter(r -> r.getSource() != null)
                .collect(Collectors.groupingBy(MarketIntelligence::getSource, Collectors.counting()));

        results.forEach(mi -> {
            if (mi.getSource() != null) {
                long count = sourceCount.getOrDefault(mi.getSource(), 1L);
                if (count > 1) {
                    int bonus = (int) Math.min((count - 1) * 5, 20);
                    mi.setScore(Math.min(mi.getScore() + bonus, 100));
                    if (!mi.getCriteresDetectes().contains("Popularité ✓")) {
                        mi.getCriteresDetectes().add("Popularité ✓");
                    }
                }
            }
            mi.setNiveauPotentiel(niveau(mi.getScore()));
        });
    }

    private void scoreOne(MarketIntelligence mi) {
        String text = normalize(
                (mi.getTitle()   != null ? mi.getTitle()   : "") + " " +
                (mi.getSnippet() != null ? mi.getSnippet() : "")
        );

        int score = 0;
        List<String> detected = new ArrayList<>();

        for (Critere c : CRITERES) {
            for (String kw : c.keywords()) {
                if (text.contains(kw)) {
                    score += c.points();
                    detected.add(c.label());
                    break;
                }
            }
        }

        score = Math.min(score, 100);
        mi.setScore(score);
        mi.setCriteresDetectes(detected);
        mi.setNiveauPotentiel(niveau(score));
    }

    private static MarketIntelligence.NiveauPotentiel niveau(int score) {
        if (score >= 70) return MarketIntelligence.NiveauPotentiel.ELEVE;
        if (score >= 40) return MarketIntelligence.NiveauPotentiel.MOYEN;
        return MarketIntelligence.NiveauPotentiel.FAIBLE;
    }

    private static String normalize(String s) {
        return s.toLowerCase()
                .replace("é", "e").replace("è", "e").replace("ê", "e")
                .replace("à", "a").replace("â", "a")
                .replace("ô", "o").replace("î", "i").replace("û", "u")
                .replace("ç", "c");
    }
}
