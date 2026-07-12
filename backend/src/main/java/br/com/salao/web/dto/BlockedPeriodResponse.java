package br.com.salao.web.dto;

import br.com.salao.domain.entity.BlockType;

import java.time.OffsetDateTime;
import java.util.UUID;

public record BlockedPeriodResponse(
        UUID publicId,
        OffsetDateTime startAt,
        OffsetDateTime endAt,
        String reason,
        BlockType blockType
) {
}
