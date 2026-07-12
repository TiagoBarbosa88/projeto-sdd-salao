package br.com.salao.web.dto;

import br.com.salao.domain.entity.Role;

public record MeResponse(
        AuthResponse.UserSummary user,
        AuthResponse.TenantSummary tenant,
        Role role
) {}
