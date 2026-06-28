package com.attijari.growth.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.Map;

@Data
public class KybRequest {

    @NotBlank
    private String companyName;

    @NotBlank
    private String legalForm;

    @NotBlank
    private String fiscalMatricule;

    private String startupActNumber; // optional — ANPE

    @NotBlank
    private String registeredAddress;

    @NotBlank
    private String representativeFullName;

    @NotBlank
    private String representativeCin;

    // fileId values returned by POST /api/kyb/documents
    // Keys: ACTE_CONSTITUTION | MATRICULE_FISCAL | CIN_GERANT | JUSTIFICATIF_SIEGE
    private Map<String, String> documentFileIds;
    private Map<String, String> documentFileNames;
}
