package com.attijari.growth.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class ProfileRequest {

    @NotBlank(message = "Le secteur d'activité est obligatoire")
    private String businessSector;

    @NotBlank(message = "Le stade de développement est obligatoire")
    private String developmentStage;

    @NotEmpty(message = "Au moins un besoin prioritaire est requis")
    private List<String> priorityNeeds;

    private String companyName;
    private String companyDescription;
    private String location;
    private String linkedinUrl;
    private String websiteUrl;
}
