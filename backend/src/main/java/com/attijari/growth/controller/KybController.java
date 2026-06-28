package com.attijari.growth.controller;

import com.attijari.growth.dto.request.KybRequest;
import com.attijari.growth.dto.request.KybReviewRequest;
import com.attijari.growth.exception.BadRequestException;
import com.attijari.growth.exception.NotFoundException;
import com.attijari.growth.model.KybDocument;
import com.attijari.growth.model.KybDossier;
import com.attijari.growth.repository.KybDocumentRepository;
import com.attijari.growth.repository.UserRepository;
import com.attijari.growth.service.KybService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/kyb")
@RequiredArgsConstructor
public class KybController {

    private final KybService kybService;
    private final KybDocumentRepository kybDocumentRepository;
    private final UserRepository userRepository;

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
    private static final Set<String> ALLOWED_TYPES = Set.of(
            "application/pdf", "image/jpeg", "image/png", "image/jpg");
    private static final Set<String> VALID_DOC_TYPES = Set.of(
            "ACTE_CONSTITUTION", "MATRICULE_FISCAL", "CIN_GERANT", "JUSTIFICATIF_SIEGE");

    // ── Entrepreneur ────────────────────────────────────────────────────────

    @PostMapping
    @PreAuthorize("hasRole('ENTREPRENEUR')")
    public ResponseEntity<KybDossier> submit(
            @AuthenticationPrincipal UserDetails principal,
            @Valid @RequestBody KybRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(kybService.submit(getUserId(principal), request));
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('ENTREPRENEUR')")
    public ResponseEntity<KybDossier> getMyDossier(
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(kybService.getMyDossier(getUserId(principal)));
    }

    // ── Community Manager / Compliance Officer ──────────────────────────────

    @GetMapping("/pending")
    @PreAuthorize("hasRole('COMMUNITY_MANAGER')")
    public ResponseEntity<List<KybDossier>> getPending() {
        return ResponseEntity.ok(kybService.getPendingDossiers());
    }

    @GetMapping
    @PreAuthorize("hasRole('COMMUNITY_MANAGER')")
    public ResponseEntity<List<KybDossier>> getAll() {
        return ResponseEntity.ok(kybService.getAllDossiers());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('COMMUNITY_MANAGER')")
    public ResponseEntity<KybDossier> getById(@PathVariable String id) {
        return ResponseEntity.ok(kybService.getById(id));
    }

    @PatchMapping("/{id}/review")
    @PreAuthorize("hasRole('COMMUNITY_MANAGER')")
    public ResponseEntity<KybDossier> review(
            @PathVariable String id,
            @AuthenticationPrincipal UserDetails principal,
            @Valid @RequestBody KybReviewRequest request) {
        return ResponseEntity.ok(kybService.review(getUserId(principal), id, request));
    }

    // ── Document upload / download ──────────────────────────────────────────

    @PostMapping(value = "/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ENTREPRENEUR')")
    public ResponseEntity<Map<String, String>> uploadDocument(
            @RequestParam("file") MultipartFile file,
            @RequestParam("docType") String docType,
            @AuthenticationPrincipal UserDetails principal) throws IOException {

        if (!VALID_DOC_TYPES.contains(docType)) {
            throw new BadRequestException("Type de document invalide : " + docType);
        }
        if (file.isEmpty()) {
            throw new BadRequestException("Le fichier est vide.");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BadRequestException("Fichier trop volumineux. Taille maximale : 10 Mo.");
        }
        String contentType = file.getContentType();
        String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";
        boolean validExtension = originalName.endsWith(".pdf") || originalName.endsWith(".jpg")
                || originalName.endsWith(".jpeg") || originalName.endsWith(".png");
        boolean validContentType = contentType != null && ALLOWED_TYPES.contains(contentType);
        if (!validExtension && !validContentType) {
            throw new BadRequestException("Format non supporté. Utilisez PDF, JPG ou PNG.");
        }
        // Normalise the stored content type when the browser sends application/octet-stream
        if (contentType == null || contentType.equals("application/octet-stream")) {
            if (originalName.endsWith(".pdf"))                          contentType = "application/pdf";
            else if (originalName.endsWith(".png"))                     contentType = "image/png";
            else                                                         contentType = "image/jpeg";
        }

        KybDocument doc = new KybDocument();
        doc.setUploadedByUserId(getUserId(principal));
        doc.setDocType(docType);
        doc.setFileName(file.getOriginalFilename());
        doc.setContentType(contentType);
        doc.setData(file.getBytes());
        doc.setFileSize(file.getSize());

        KybDocument saved = kybDocumentRepository.save(doc);
        return ResponseEntity.ok(Map.of(
                "fileId",   saved.getId(),
                "fileName", saved.getFileName() != null ? saved.getFileName() : docType));
    }

    @GetMapping("/documents/{fileId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<byte[]> downloadDocument(@PathVariable String fileId) {
        KybDocument doc = kybDocumentRepository.findById(fileId)
                .orElseThrow(() -> new NotFoundException("Document introuvable."));

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"" + (doc.getFileName() != null ? doc.getFileName() : fileId) + "\"")
                .contentType(MediaType.parseMediaType(
                        doc.getContentType() != null ? doc.getContentType() : "application/octet-stream"))
                .body(doc.getData());
    }

    // ── Helper ──────────────────────────────────────────────────────────────

    private String getUserId(UserDetails principal) {
        return userRepository.findByEmail(principal.getUsername()).orElseThrow().getId();
    }
}
