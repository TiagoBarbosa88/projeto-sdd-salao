package br.com.salao.service;

import br.com.salao.domain.entity.Role;
import br.com.salao.domain.entity.Tenant;
import br.com.salao.domain.repository.TenantUserRepository;
import br.com.salao.web.dto.TeamMemberResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TeamService {

    private final TenantUserRepository tenantUserRepository;
    private final TenantResolver tenantResolver;

    public TeamService(TenantUserRepository tenantUserRepository, TenantResolver tenantResolver) {
        this.tenantUserRepository = tenantUserRepository;
        this.tenantResolver = tenantResolver;
    }

    @Transactional(readOnly = true)
    public List<TeamMemberResponse> listMembers(Role role) {
        Tenant tenant = tenantResolver.requireCurrentTenant();
        return tenantUserRepository.findByTenant_IdWithUser(tenant.getId(), role).stream()
                .map(tenantUser -> new TeamMemberResponse(
                        tenantUser.getUser().getPublicId(),
                        tenantUser.getUser().getName(),
                        tenantUser.getRole()))
                .toList();
    }
}
