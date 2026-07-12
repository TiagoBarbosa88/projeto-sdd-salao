package br.com.salao.web.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record PublicGuestBookingRequest(
        UUID servicePublicId,
        UUID professionalPublicId,
        OffsetDateTime startAt,
        String guestName,
        String guestPhone
) {
}
