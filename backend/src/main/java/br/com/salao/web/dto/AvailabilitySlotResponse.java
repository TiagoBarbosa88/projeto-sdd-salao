package br.com.salao.web.dto;

import java.time.OffsetDateTime;

public record AvailabilitySlotResponse(OffsetDateTime startAt, OffsetDateTime endAt) {
}
