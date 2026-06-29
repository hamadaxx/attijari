package com.attijari.growth.service;

import com.attijari.growth.dto.request.FinancialRequest;
import com.attijari.growth.exception.NotFoundException;
import com.attijari.growth.model.EntrepreneurProfile;
import com.attijari.growth.model.FinancialData;
import com.attijari.growth.repository.EntrepreneurProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class FinancialService {

    private final EntrepreneurProfileRepository profileRepository;

    public EntrepreneurProfile submitOrUpdate(String userId, FinancialRequest req) {
        EntrepreneurProfile profile = profileRepository.findByUserId(userId)
                .orElseThrow(() -> new NotFoundException("Profil introuvable."));

        FinancialData data = new FinancialData();
        data.setMonthlyRevenue(req.getMonthlyRevenue());
        data.setMonthlyBurnRate(req.getMonthlyBurnRate());
        data.setRunwayMonths(req.getRunwayMonths());
        data.setTotalFundingRaised(req.getTotalFundingRaised() != null ? req.getTotalFundingRaised() : 0.0);
        data.setFundingStage(req.getFundingStage() != null ? req.getFundingStage() : FinancialData.FundingStage.BOOTSTRAPPED);
        data.setBreakEvenReached(req.getBreakEvenReached() != null && req.getBreakEvenReached());
        data.setEmployeeCount(req.getEmployeeCount() != null ? req.getEmployeeCount() : 0);
        data.setLastUpdatedAt(LocalDateTime.now());

        boolean isFirst = profile.getFinancialData() == null;
        if (isFirst) data.setSubmittedAt(LocalDateTime.now());
        else data.setSubmittedAt(profile.getFinancialData().getSubmittedAt());

        profile.setFinancialData(data);
        profile.setFinancialViabilityScore(computeScore(data));
        profile.setUpdatedAt(LocalDateTime.now());

        return profileRepository.save(profile);
    }

    public EntrepreneurProfile getProfile(String userId) {
        return profileRepository.findByUserId(userId)
                .orElseThrow(() -> new NotFoundException("Profil introuvable."));
    }

    /**
     * Score de Viabilité Financière — 0 à 100 pts.
     *
     * Revenus         (0–30) : >0 +10 | >5 000 TND +10 | >20 000 TND +10
     * Rentabilité     (0–20) : CA > burn rate → +20
     * Runway          (0–20) : ≥3 mois +10 | ≥6 mois +5 | ≥12 mois +5
     * Équipe & fonds  (0–15) : ≥1 emp +5 | ≥5 emp +5 | financement>0 +5
     * Point mort      (0–15) : atteint → +15
     */
    public static int computeScore(FinancialData d) {
        if (d == null) return 0;
        int score = 0;

        // Revenus
        double rev = d.getMonthlyRevenue() != null ? d.getMonthlyRevenue() : 0;
        if (rev > 0)       score += 10;
        if (rev > 5_000)   score += 10;
        if (rev > 20_000)  score += 10;

        // Rentabilité
        double burn = d.getMonthlyBurnRate() != null ? d.getMonthlyBurnRate() : 0;
        if (rev > 0 && burn > 0 && rev > burn) score += 20;

        // Runway
        int runway = d.getRunwayMonths() != null ? d.getRunwayMonths() : 0;
        if (runway >= 3)  score += 10;
        if (runway >= 6)  score += 5;
        if (runway >= 12) score += 5;

        // Équipe & financement
        int emp = d.getEmployeeCount() != null ? d.getEmployeeCount() : 0;
        if (emp >= 1) score += 5;
        if (emp >= 5) score += 5;
        double funding = d.getTotalFundingRaised() != null ? d.getTotalFundingRaised() : 0;
        if (funding > 0) score += 5;

        // Point mort
        if (Boolean.TRUE.equals(d.getBreakEvenReached())) score += 15;

        return Math.min(100, score);
    }
}
