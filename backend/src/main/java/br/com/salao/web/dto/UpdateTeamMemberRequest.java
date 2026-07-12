package br.com.salao.web.dto;

import br.com.salao.domain.entity.Role;

public record UpdateTeamMemberRequest(
        String name,
        String phone,
        Boolean bookable,
        Boolean active,
        Role role,
        Boolean loginActive,
        String password
) {
}
