package com.attijari.growth.controller;

import com.attijari.growth.dto.request.FinancialRequest;
import com.attijari.growth.model.EntrepreneurProfile;
import com.attijari.growth.repository.UserRepository;
import com.attijari.growth.service.FinancialService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/financial")
@RequiredArgsConstructor
public class FinancialController {

    private final FinancialService financialService;
    private final UserRepository userRepository;

    @PostMapping("/me")
    @PreAuthorize("hasRole('ENTREPRENEUR')")
    public ResponseEntity<EntrepreneurProfile> submit(
            @AuthenticationPrincipal UserDetails principal,
            @Valid @RequestBody FinancialRequest request) {
        return ResponseEntity.ok(financialService.submitOrUpdate(getUserId(principal), request));
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('ENTREPRENEUR')")
    public ResponseEntity<EntrepreneurProfile> getMe(
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(financialService.getProfile(getUserId(principal)));
    }

    private String getUserId(UserDetails principal) {
        return userRepository.findByEmail(principal.getUsername()).orElseThrow().getId();
    }
}
