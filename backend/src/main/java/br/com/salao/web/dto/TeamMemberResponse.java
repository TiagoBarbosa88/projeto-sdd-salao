package br.com.salao.web.dto;

import br.com.salao.domain.entity.Role;

import java.util.UUID;

public record TeamMemberResponse(UUID publicId, String name, String email, Role role, boolean loginActive) {
}
