package br.com.salao.web.dto;

import br.com.salao.domain.entity.Role;

import java.util.UUID;

public record ProfessionalResponse(
        UUID publicId,
        String name,
        String email,
        String phone,
        Role role,
        boolean bookable,
        boolean active,
        boolean loginActive
) {
}
