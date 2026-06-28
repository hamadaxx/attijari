package com.attijari.growth.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@Document(collection = "kyb_documents")
public class KybDocument {

    @Id
    private String id;

    private String uploadedByUserId;

    // ACTE_CONSTITUTION | MATRICULE_FISCAL | CIN_GERANT | JUSTIFICATIF_SIEGE
    private String docType;

    private String fileName;
    private String contentType;
    private byte[] data;
    private long fileSize;

    private LocalDateTime uploadedAt = LocalDateTime.now();
}
