package br.com.salao.web.dto;

import br.com.salao.domain.entity.BlockType;

import java.time.OffsetDateTime;

public record CreateBlockedPeriodRequest(
        OffsetDateTime startAt,
        OffsetDateTime endAt,
        String reason,
        BlockType blockType
) {
}
