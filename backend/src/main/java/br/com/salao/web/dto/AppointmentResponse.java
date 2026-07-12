package br.com.salao.web.dto;

import br.com.salao.domain.entity.AppointmentStatus;

import java.time.OffsetDateTime;
import java.util.UUID;

public record AppointmentResponse(
        UUID publicId,
        NamedRef service,
        NamedRef professional,
        NamedRef client,
        OffsetDateTime startAt,
        OffsetDateTime endAt,
        AppointmentStatus status,
        OffsetDateTime createdAt
) {
}
