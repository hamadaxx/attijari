package com.attijari.growth.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ProfileValidationRequest {

    @NotNull
    private Action action; // APPROVE, REJECT, REQUEST_INFO

    private String reason; // Required when REJECT or REQUEST_INFO

    public enum Action {
        APPROVE, REJECT, REQUEST_INFO
    }
}
