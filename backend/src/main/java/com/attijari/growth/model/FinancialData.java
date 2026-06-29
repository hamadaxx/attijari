package com.attijari.growth.model;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Embedded financial data — stored inside EntrepreneurProfile.
 * Used to compute the financialViabilityScore (0–100).
 */
@Data
@NoArgsConstructor
public class FinancialData {

    /** Chiffre d'affaires mensuel moyen (TND) */
    private Double monthlyRevenue;

    /** Dépenses opérationnelles mensuelles (TND) */
    private Double monthlyBurnRate;

    /** Runway estimé en mois (trésorerie disponible / burn rate) */
    private Integer runwayMonths;

    /** Montant total de financement levé (TND) — 0 si bootstrapped */
    private Double totalFundingRaised;

    /** Stade de financement */
    private FundingStage fundingStage = FundingStage.BOOTSTRAPPED;

    /** Le point mort (break-even) est-il atteint ? */
    private Boolean breakEvenReached = false;

    /** Nombre d'employés (y compris fondateurs) */
    private Integer employeeCount;

    private LocalDateTime submittedAt;
    private LocalDateTime lastUpdatedAt;

    public enum FundingStage {
        BOOTSTRAPPED,
        PRE_SEED,
        SEED,
        SERIES_A,
        SERIES_B_PLUS
    }
}
