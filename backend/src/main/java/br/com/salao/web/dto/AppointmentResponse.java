package br.com.salao.web.dto;

import br.com.salao.domain.entity.AppointmentStatus;

import java.time.OffsetDateTime;
import java.util.UUID;

public record AppointmentResponse(
        UUID publicId,
        NamedRef service,
        NamedRef professional,
        NamedRef client,
        String guestName,
        String guestPhone,
        OffsetDateTime startAt,
        OffsetDateTime endAt,
        AppointmentStatus status,
        OffsetDateTime createdAt
) {
}
