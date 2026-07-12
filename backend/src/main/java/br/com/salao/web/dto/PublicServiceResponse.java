package br.com.salao.web.dto;

import br.com.salao.domain.entity.ServiceGender;

import java.math.BigDecimal;
import java.util.UUID;

public record PublicServiceResponse(
        UUID publicId,
        String name,
        String description,
        Integer durationMinutes,
        BigDecimal price,
        String imageUrl,
        ServiceGender gender) {}
