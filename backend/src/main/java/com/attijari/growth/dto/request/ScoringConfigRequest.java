package com.attijari.growth.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.Map;

@Data
public class ScoringConfigRequest {

    @NotNull
    private Map<String, Integer> weights;

    @Min(1)
    private int prequalificationThreshold = 50;

    @NotBlank(message = "Une justification métier est obligatoire.")
    private String justification;
}
