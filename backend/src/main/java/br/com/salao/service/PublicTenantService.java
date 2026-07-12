package br.com.salao.service;

import br.com.salao.domain.entity.ProfessionalProfile;
import br.com.salao.domain.entity.SalonService;
import br.com.salao.domain.entity.Tenant;
import br.com.salao.domain.repository.ProfessionalProfileRepository;
import br.com.salao.domain.repository.SalonServiceRepository;
import br.com.salao.domain.repository.TenantRepository;
import br.com.salao.web.dto.PublicProfessionalResponse;
import br.com.salao.web.dto.PublicServiceResponse;
import br.com.salao.web.dto.PublicTenantResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PublicTenantService {

    private final TenantRepository tenantRepository;
    private final SalonServiceRepository salonServiceRepository;
    private final ProfessionalProfileRepository professionalProfileRepository;
    private final PublicBusinessHoursService publicBusinessHoursService;

    public PublicTenantService(
            TenantRepository tenantRepository,
            SalonServiceRepository salonServiceRepository,
            ProfessionalProfileRepository professionalProfileRepository,
            PublicBusinessHoursService publicBusinessHoursService) {
        this.tenantRepository = tenantRepository;
        this.salonServiceRepository = salonServiceRepository;
        this.professionalProfileRepository = professionalProfileRepository;
        this.publicBusinessHoursService = publicBusinessHoursService;
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

    @Transactional(readOnly = true)
    public List<PublicProfessionalResponse> getBookableProfessionalsBySlug(String slug) {
        Tenant tenant = tenantRepository.findBySlug(slug)
                .filter(Tenant::isActive)
                .orElseThrow(ResourceNotFoundException::new);
        return professionalProfileRepository.findBookableByTenantId(tenant.getId()).stream()
                .map(this::toProfessionalResponse)
                .toList();
    }

    private PublicTenantResponse toTenantResponse(Tenant tenant) {
        return new PublicTenantResponse(
                tenant.getPublicId(),
                tenant.getName(),
                tenant.getSlug(),
                tenant.getDescription(),
                tenant.getPhone(),
                tenant.getWhatsapp(),
                tenant.getAddress(),
                publicBusinessHoursService.buildLines(tenant.getId()),
                tenant.getLogoUrl(),
                tenant.getInstagramUrl(),
                tenant.getFacebookUrl(),
                tenant.getTiktokUrl(),
                tenant.getWebsiteUrl(),
                tenant.getYoutubeUrl(),
                tenant.getGoogleMapsUrl(),
                tenant.getSeoTitle(),
                tenant.getSeoDescription(),
                tenant.getSeoImageUrl()
        );
    }

    private PublicServiceResponse toServiceResponse(SalonService service) {
        return new PublicServiceResponse(
                service.getPublicId(),
                service.getName(),
                service.getDescription(),
                service.getDurationMinutes(),
                service.getPrice(),
                service.getImageUrl(),
                service.getGender());
    }

    private PublicProfessionalResponse toProfessionalResponse(ProfessionalProfile profile) {
        return new PublicProfessionalResponse(
                profile.getTenantUser().getUser().getPublicId(),
                profile.getTenantUser().getUser().getName(),
                profile.getPhone()
        );
    }
}
