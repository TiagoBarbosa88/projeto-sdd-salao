package br.com.salao.service;

import br.com.salao.domain.entity.Appointment;
import br.com.salao.domain.entity.AppointmentStatus;
import br.com.salao.domain.entity.AuditAction;
import br.com.salao.domain.entity.SalonService;
import br.com.salao.domain.entity.Tenant;
import br.com.salao.domain.entity.TenantSchedulingSettings;
import br.com.salao.domain.entity.User;
import br.com.salao.domain.repository.AppointmentRepository;
import br.com.salao.domain.repository.SalonServiceRepository;
import br.com.salao.domain.repository.TenantRepository;
import br.com.salao.domain.repository.TenantUserRepository;
import br.com.salao.web.dto.AppointmentResponse;
import br.com.salao.web.dto.NamedRef;
import br.com.salao.web.dto.PublicGuestBookingRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;

@Service
public class PublicBookingService {

    private final TenantRepository tenantRepository;
    private final SalonServiceRepository salonServiceRepository;
    private final TenantUserRepository tenantUserRepository;
    private final AppointmentRepository appointmentRepository;
    private final AvailabilityService availabilityService;
    private final SalonSettingsService salonSettingsService;
    private final AuditService auditService;

    public PublicBookingService(
            TenantRepository tenantRepository,
            SalonServiceRepository salonServiceRepository,
            TenantUserRepository tenantUserRepository,
            AppointmentRepository appointmentRepository,
            AvailabilityService availabilityService,
            SalonSettingsService salonSettingsService,
            AuditService auditService) {
        this.tenantRepository = tenantRepository;
        this.salonServiceRepository = salonServiceRepository;
        this.tenantUserRepository = tenantUserRepository;
        this.appointmentRepository = appointmentRepository;
        this.availabilityService = availabilityService;
        this.salonSettingsService = salonSettingsService;
        this.auditService = auditService;
    }

    @Transactional
    public AppointmentResponse createGuestAppointment(String slug, PublicGuestBookingRequest request) {
        if (request.guestName() == null || request.guestName().isBlank()) {
            throw new InvalidScheduleException();
        }

        Tenant tenant = tenantRepository.findBySlug(slug)
                .filter(Tenant::isActive)
                .orElseThrow(ResourceNotFoundException::new);

        SalonService service = salonServiceRepository
                .findByPublicIdAndTenantId(request.servicePublicId(), tenant.getId())
                .orElseThrow(ResourceNotFoundException::new);

        if (!service.isActive()) {
            throw new InactiveServiceException();
        }

        User professional = tenantUserRepository
                .findByTenant_IdAndUser_PublicId(tenant.getId(), request.professionalPublicId())
                .orElseThrow(ResourceNotFoundException::new)
                .getUser();

        availabilityService.validateSlotAvailable(tenant, professional, service, request.startAt());

        TenantSchedulingSettings settings = salonSettingsService.requireSchedulingSettingsForTenant(tenant.getId());
        OffsetDateTime endAt = request.startAt().plusMinutes(service.getDurationMinutes());

        Appointment appointment = new Appointment();
        appointment.setTenantId(tenant.getId());
        appointment.setService(service);
        appointment.setProfessional(professional);
        appointment.setGuestName(request.guestName());
        appointment.setGuestPhone(request.guestPhone());
        appointment.setBufferMinutes(settings.getBufferMinutes());
        appointment.setStartAt(request.startAt());
        appointment.setEndAt(endAt);
        appointment.setStatus(AppointmentStatus.SCHEDULED);

        Appointment saved = appointmentRepository.save(appointment);
        auditService.record(
                tenant.getId(),
                null,
                AuditAction.APPOINTMENT_CREATED,
                "Appointment",
                saved.getPublicId(),
                "{\"guest\":\"" + escapeJson(request.guestName()) + "\",\"startAt\":\"" + saved.getStartAt() + "\"}");

        return toResponse(saved);
    }

    private String escapeJson(String value) {
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    private AppointmentResponse toResponse(Appointment appointment) {
        NamedRef clientRef = appointment.getClient() != null
                ? new NamedRef(appointment.getClient().getPublicId(), appointment.getClient().getName())
                : null;
        return new AppointmentResponse(
                appointment.getPublicId(),
                new NamedRef(appointment.getService().getPublicId(), appointment.getService().getName()),
                new NamedRef(appointment.getProfessional().getPublicId(), appointment.getProfessional().getName()),
                clientRef,
                appointment.getGuestName(),
                appointment.getGuestPhone(),
                appointment.getStartAt(),
                appointment.getEndAt(),
                appointment.getStatus(),
                appointment.getCreatedAt()
        );
    }
}
