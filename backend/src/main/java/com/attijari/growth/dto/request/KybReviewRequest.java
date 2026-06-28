package com.attijari.growth.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class KybReviewRequest {

    @NotNull
    private Action action;

    private String notes; // always shown in audit; shown to entrepreneur on REJECTED / INFO_REQUIRED

    public enum Action {
        APPROVE, REJECT, INFO_REQUIRED
    }
}
