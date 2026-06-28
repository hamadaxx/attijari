package com.attijari.growth.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class PublicationRequest {

    @NotBlank(message = "Le titre est obligatoire")
    private String title;

    @NotBlank(message = "Le contenu est obligatoire")
    @Size(min = 100, message = "Le contenu doit comporter au moins 100 caractères")
    private String content;

    private String sector;
}
