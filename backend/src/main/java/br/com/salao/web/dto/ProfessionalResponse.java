package br.com.salao.web.dto;

import java.util.UUID;

public record ProfessionalResponse(
        UUID publicId,
        String name,
        String phone,
        boolean bookable,
        boolean active
) {
}
