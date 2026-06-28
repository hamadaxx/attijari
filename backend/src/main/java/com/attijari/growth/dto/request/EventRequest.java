package com.attijari.growth.dto.request;

import com.attijari.growth.model.Event;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class EventRequest {

    @NotBlank(message = "Le titre est obligatoire")
    private String title;

    private String description;

    @NotNull
    private Event.EventType type;

    @NotNull @Future
    private LocalDateTime startDateTime;

    @NotNull @Future
    private LocalDateTime endDateTime;
}
