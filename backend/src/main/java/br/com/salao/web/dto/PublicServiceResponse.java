package br.com.salao.web.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record PublicServiceResponse(
        UUID publicId,
        String name,
        String description,
        Integer durationMinutes,
        BigDecimal price) {}
