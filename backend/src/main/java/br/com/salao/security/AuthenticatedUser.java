package br.com.salao.security;

import br.com.salao.domain.entity.Role;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public class AuthenticatedUser implements UserDetails {

    private final UUID userPublicId;
    private final UUID tenantPublicId;
    private final String email;
    private final Role role;

    public AuthenticatedUser(UUID userPublicId, UUID tenantPublicId, String email, Role role) {
        this.userPublicId = userPublicId;
        this.tenantPublicId = tenantPublicId;
        this.email = email;
        this.role = role;
    }

    public UUID getUserPublicId() {
        return userPublicId;
    }

    public UUID getTenantPublicId() {
        return tenantPublicId;
    }

    public Role getRole() {
        return role;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public String getPassword() {
        return null;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
