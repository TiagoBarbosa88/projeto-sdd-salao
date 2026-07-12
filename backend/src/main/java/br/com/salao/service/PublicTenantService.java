package br.com.salao.service;

import br.com.salao.domain.entity.SalonService;
import br.com.salao.domain.entity.Tenant;
import br.com.salao.domain.repository.SalonServiceRepository;
import br.com.salao.domain.repository.TenantRepository;
import br.com.salao.web.dto.PublicServiceResponse;
import br.com.salao.web.dto.PublicTenantResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PublicTenantService {

    private final TenantRepository tenantRepository;
    private final SalonServiceRepository salonServiceRepository;

    public PublicTenantService(TenantRepository tenantRepository, SalonServiceRepository salonServiceRepository) {
        this.tenantRepository = tenantRepository;
        this.salonServiceRepository = salonServiceRepository;
    }

    @Transactional(readOnly = true)
    public PublicTenantResponse getTenantBySlug(String slug) {
        Tenant tenant = tenantRepository.findBySlug(slug)
                .filter(Tenant::isActive)
                .orElseThrow(ResourceNotFoundException::new);
        return toTenantResponse(tenant);
    }

    @Transactional(readOnly = true)
    public List<PublicServiceResponse> getActiveServicesBySlug(String slug) {
        Tenant tenant = tenantRepository.findBySlug(slug)
                .filter(Tenant::isActive)
                .orElseThrow(ResourceNotFoundException::new);
        return salonServiceRepository.findByTenantIdAndActiveTrueOrderByNameAsc(tenant.getId()).stream()
                .map(this::toServiceResponse)
                .toList();
    }

    private PublicTenantResponse toTenantResponse(Tenant tenant) {
        return new PublicTenantResponse(tenant.getPublicId(), tenant.getName(), tenant.getSlug());
    }

    private PublicServiceResponse toServiceResponse(SalonService service) {
        return new PublicServiceResponse(
                service.getPublicId(),
                service.getName(),
                service.getDescription(),
                service.getDurationMinutes(),
                service.getPrice());
    }
}
