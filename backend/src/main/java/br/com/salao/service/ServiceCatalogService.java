package br.com.salao.service;

import br.com.salao.domain.entity.AuditAction;
import br.com.salao.domain.entity.SalonService;
import br.com.salao.domain.entity.Tenant;
import br.com.salao.domain.repository.SalonServiceRepository;
import br.com.salao.web.dto.CreateServiceRequest;
import br.com.salao.web.dto.ServiceResponse;
import br.com.salao.web.dto.UpdateServiceRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class ServiceCatalogService {

    private final SalonServiceRepository salonServiceRepository;
    private final TenantResolver tenantResolver;
    private final AuditService auditService;

    public ServiceCatalogService(
            SalonServiceRepository salonServiceRepository,
            TenantResolver tenantResolver,
            AuditService auditService) {
        this.salonServiceRepository = salonServiceRepository;
        this.tenantResolver = tenantResolver;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<ServiceResponse> listServices() {
        Tenant tenant = tenantResolver.requireCurrentTenant();
        return salonServiceRepository.findByTenantIdOrderByNameAsc(tenant.getId()).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ServiceResponse getService(UUID publicId) {
        SalonService service = findServiceForTenant(publicId);
        return toResponse(service);
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public ServiceResponse createService(CreateServiceRequest request) {
        Tenant tenant = tenantResolver.requireCurrentTenant();

        SalonService service = new SalonService();
        service.setTenantId(tenant.getId());
        service.setName(request.name());
        service.setDescription(request.description());
        service.setDurationMinutes(request.durationMinutes());
        service.setPrice(request.price());
        service.setActive(true);

        SalonService saved = salonServiceRepository.save(service);
        auditService.record(
                tenant.getId(),
                auditService.resolveCurrentActorUserId(),
                AuditAction.SERVICE_CREATED,
                "Service",
                saved.getPublicId(),
                "{\"name\":\"" + escapeJson(saved.getName()) + "\",\"price\":"
                        + saved.getPrice()
                        + ",\"durationMinutes\":"
                        + saved.getDurationMinutes()
                        + ",\"active\":true}");
        return toResponse(saved);
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public ServiceResponse updateService(UUID publicId, UpdateServiceRequest request) {
        SalonService service = findServiceForTenant(publicId);
        service.setName(request.name());
        service.setDescription(request.description());
        service.setDurationMinutes(request.durationMinutes());
        service.setPrice(request.price());
        service.setActive(request.active());

        SalonService saved = salonServiceRepository.save(service);
        auditService.record(
                tenantResolver.requireCurrentTenant().getId(),
                auditService.resolveCurrentActorUserId(),
                AuditAction.SERVICE_UPDATED,
                "Service",
                saved.getPublicId(),
                buildServiceAuditMetadata(saved));
        return toResponse(saved);
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public void deactivateService(UUID publicId) {
        SalonService service = findServiceForTenant(publicId);
        service.setActive(false);
        salonServiceRepository.save(service);
        auditService.record(
                tenantResolver.requireCurrentTenant().getId(),
                auditService.resolveCurrentActorUserId(),
                AuditAction.SERVICE_DEACTIVATED,
                "Service",
                service.getPublicId(),
                buildServiceAuditMetadata(service));
    }

    private String buildServiceAuditMetadata(SalonService service) {
        return "{\"name\":\""
                + escapeJson(service.getName())
                + "\",\"price\":"
                + service.getPrice()
                + ",\"durationMinutes\":"
                + service.getDurationMinutes()
                + ",\"active\":"
                + service.isActive()
                + "}";
    }

    private String escapeJson(String value) {
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    private SalonService findServiceForTenant(UUID publicId) {
        Tenant tenant = tenantResolver.requireCurrentTenant();
        return salonServiceRepository.findByPublicIdAndTenantId(publicId, tenant.getId())
                .orElseThrow(ResourceNotFoundException::new);
    }

    private ServiceResponse toResponse(SalonService service) {
        return new ServiceResponse(
                service.getPublicId(),
                service.getName(),
                service.getDescription(),
                service.getDurationMinutes(),
                service.getPrice(),
                service.isActive()
        );
    }
}
