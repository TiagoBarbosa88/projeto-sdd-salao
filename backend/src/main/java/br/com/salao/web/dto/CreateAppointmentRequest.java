package br.com.salao.web.dto;

import jakarta.validation.constraints.NotNull;

import java.time.OffsetDateTime;
import java.util.UUID;

public record CreateAppointmentRequest(
        @NotNull UUID servicePublicId,
        @NotNull UUID professionalPublicId,
        UUID clientPublicId,
        @NotNull OffsetDateTime startAt
) {
}
