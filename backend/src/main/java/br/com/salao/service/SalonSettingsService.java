package br.com.salao.service;

import br.com.salao.domain.entity.Tenant;
import br.com.salao.domain.entity.TenantSchedulingSettings;
import br.com.salao.domain.repository.TenantRepository;
import br.com.salao.domain.repository.TenantSchedulingSettingsRepository;
import br.com.salao.web.dto.SalonSettingsResponse;
import br.com.salao.web.dto.SchedulingSettingsResponse;
import br.com.salao.web.dto.UpdateSalonSettingsRequest;
import br.com.salao.web.dto.UpdateSchedulingSettingsRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SalonSettingsService {

    private final TenantRepository tenantRepository;
    private final TenantSchedulingSettingsRepository schedulingSettingsRepository;
    private final TenantResolver tenantResolver;

    public SalonSettingsService(
            TenantRepository tenantRepository,
            TenantSchedulingSettingsRepository schedulingSettingsRepository,
            TenantResolver tenantResolver) {
        this.tenantRepository = tenantRepository;
        this.schedulingSettingsRepository = schedulingSettingsRepository;
        this.tenantResolver = tenantResolver;
    }

    @Transactional(readOnly = true)
    public SalonSettingsResponse getSalonSettings() {
        Tenant tenant = tenantResolver.requireCurrentTenant();
        return toSalonResponse(tenant);
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public SalonSettingsResponse updateSalonSettings(UpdateSalonSettingsRequest request) {
        Tenant tenant = tenantResolver.requireCurrentTenant();
        if (request.name() != null && !request.name().isBlank()) {
            tenant.setName(request.name());
        }
        tenant.setDescription(request.description());
        tenant.setPhone(request.phone());
        tenant.setWhatsapp(request.whatsapp());
        tenant.setAddress(request.address());
        tenant.setLogoUrl(request.logoUrl());
        tenant.setSeoTitle(request.seoTitle());
        tenant.setSeoDescription(request.seoDescription());
        tenant.setSeoImageUrl(request.seoImageUrl());
        return toSalonResponse(tenantRepository.save(tenant));
    }

    @Transactional(readOnly = true)
    public SchedulingSettingsResponse getSchedulingSettings() {
        TenantSchedulingSettings settings = requireSchedulingSettings();
        return toSchedulingResponse(settings);
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public SchedulingSettingsResponse updateSchedulingSettings(UpdateSchedulingSettingsRequest request) {
        validateSchedulingSettings(request);
        TenantSchedulingSettings settings = requireSchedulingSettings();
        settings.setZoneId(request.zoneId());
        settings.setBufferMinutes(request.bufferMinutes());
        settings.setSlotIntervalMinutes(request.slotIntervalMinutes());
        settings.setDayStartTime(request.dayStartTime());
        settings.setDayEndTime(request.dayEndTime());
        return toSchedulingResponse(schedulingSettingsRepository.save(settings));
    }

    @Transactional(readOnly = true)
    public TenantSchedulingSettings requireSchedulingSettingsForTenant(Long tenantId) {
        return schedulingSettingsRepository.findByTenant_Id(tenantId)
                .orElseThrow(ResourceNotFoundException::new);
    }

    private TenantSchedulingSettings requireSchedulingSettings() {
        Tenant tenant = tenantResolver.requireCurrentTenant();
        return requireSchedulingSettingsForTenant(tenant.getId());
    }

    private void validateSchedulingSettings(UpdateSchedulingSettingsRequest request) {
        if (request.dayStartTime() == null || request.dayEndTime() == null) {
            throw new InvalidScheduleException();
        }
        if (!request.dayStartTime().isBefore(request.dayEndTime())) {
            throw new InvalidScheduleException();
        }
        if (request.bufferMinutes() < 0 || request.slotIntervalMinutes() <= 0) {
            throw new InvalidScheduleException();
        }
    }

    private SalonSettingsResponse toSalonResponse(Tenant tenant) {
        return new SalonSettingsResponse(
                tenant.getPublicId(),
                tenant.getName(),
                tenant.getSlug(),
                tenant.getDescription(),
                tenant.getPhone(),
                tenant.getWhatsapp(),
                tenant.getAddress(),
                tenant.getLogoUrl(),
                tenant.getSeoTitle(),
                tenant.getSeoDescription(),
                tenant.getSeoImageUrl()
        );
    }

    private SchedulingSettingsResponse toSchedulingResponse(TenantSchedulingSettings settings) {
        return new SchedulingSettingsResponse(
                settings.getZoneId(),
                settings.getBufferMinutes(),
                settings.getSlotIntervalMinutes(),
                settings.getDayStartTime(),
                settings.getDayEndTime()
        );
    }
}
