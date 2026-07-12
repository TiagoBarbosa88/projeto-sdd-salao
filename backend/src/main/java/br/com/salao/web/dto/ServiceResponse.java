package br.com.salao.web.dto;

import br.com.salao.domain.entity.ServiceGender;

import java.math.BigDecimal;
import java.util.UUID;

public record ServiceResponse(
        UUID publicId,
        String name,
        String description,
        Integer durationMinutes,
        BigDecimal price,
        boolean active,
        String imageUrl,
        ServiceGender gender
) {
}
