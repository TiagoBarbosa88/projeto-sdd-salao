package br.com.salao.web.dto;

import br.com.salao.domain.entity.Role;

public record CreateTeamMemberRequest(
        String name,
        String email,
        String password,
        String phone,
        boolean bookable,
        Role role
) {
}
