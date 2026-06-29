package com.attijari.growth.dto.request;

import com.attijari.growth.model.FinancialData;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class FinancialRequest {

    @NotNull(message = "Le chiffre d'affaires mensuel est requis.")
    @Min(value = 0, message = "Le CA ne peut pas être négatif.")
    private Double monthlyRevenue;

    @NotNull(message = "Le burn rate mensuel est requis.")
    @Min(value = 0, message = "Le burn rate ne peut pas être négatif.")
    private Double monthlyBurnRate;

    @Min(value = 0, message = "Le runway ne peut pas être négatif.")
    private Integer runwayMonths;

    @Min(value = 0, message = "Le financement ne peut pas être négatif.")
    private Double totalFundingRaised;

    private FinancialData.FundingStage fundingStage;

    private Boolean breakEvenReached;

    @Min(value = 0, message = "Le nombre d'employés ne peut pas être négatif.")
    private Integer employeeCount;
}
