package com.attijari.growth.dto.request;

import lombok.Data;

@Data
public class ScoringConfigApprovalRequest {
    // Optional note for approval; required when rejecting
    private String note;
}
