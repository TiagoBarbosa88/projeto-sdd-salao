package br.com.salao.web.dto;

import br.com.salao.domain.entity.Role;

import java.util.UUID;

public record AuthResponse(
        String token,
        UserSummary user,
        TenantSummary tenant,
        Role role
) {
    public record UserSummary(UUID publicId, String email, String name) {}

    public record TenantSummary(UUID publicId, String name, String slug) {}
}
