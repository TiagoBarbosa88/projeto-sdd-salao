package br.com.salao.service;

import br.com.salao.domain.entity.Tenant;
import br.com.salao.domain.repository.TenantRepository;
import br.com.salao.security.TenantContext;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class TenantResolver {

    private final TenantRepository tenantRepository;

    public TenantResolver(TenantRepository tenantRepository) {
        this.tenantRepository = tenantRepository;
    }

    public Tenant requireCurrentTenant() {
        UUID tenantPublicId = TenantContext.get()
                .orElseThrow(InvalidCredentialsException::new);
        return tenantRepository.findByPublicId(tenantPublicId)
                .orElseThrow(ResourceNotFoundException::new);
    }
}
