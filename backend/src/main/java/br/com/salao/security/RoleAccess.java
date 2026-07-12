package br.com.salao.security;

import br.com.salao.domain.entity.Role;

public final class RoleAccess {

    private RoleAccess() {
    }

    public static boolean canManageSalon(Role role) {
        return role == Role.ADMIN;
    }

    public static boolean canManageSchedulingSettings(Role role) {
        return role == Role.ADMIN || role == Role.EDITOR;
    }

    public static boolean canManageAllSchedules(Role role) {
        return role == Role.ADMIN || role == Role.EDITOR;
    }

    public static boolean isStaffReader(Role role) {
        return role == Role.LEITOR || role == Role.PROFESSIONAL;
    }
}
