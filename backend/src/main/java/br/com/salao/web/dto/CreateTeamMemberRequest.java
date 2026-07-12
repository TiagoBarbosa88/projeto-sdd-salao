package br.com.salao.web.dto;

import java.util.UUID;

public record CreateTeamMemberRequest(
        String name,
        String email,
        String password,
        String phone,
        boolean bookable
) {
}
