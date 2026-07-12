package br.com.salao.service;

import br.com.salao.domain.entity.Appointment;
import br.com.salao.domain.entity.AppointmentStatus;
import br.com.salao.domain.entity.AuditAction;
import br.com.salao.domain.entity.Role;
import br.com.salao.domain.entity.SalonService;
import br.com.salao.domain.entity.Tenant;
import br.com.salao.domain.entity.TenantSchedulingSettings;
import br.com.salao.domain.entity.TenantUser;
import br.com.salao.domain.entity.User;
import br.com.salao.domain.repository.AppointmentRepository;
import br.com.salao.domain.repository.SalonServiceRepository;
import br.com.salao.domain.repository.TenantUserRepository;
import br.com.salao.domain.repository.UserRepository;
import br.com.salao.security.AuthenticatedUser;
import br.com.salao.web.dto.AppointmentResponse;
import br.com.salao.web.dto.CreateAppointmentRequest;
import br.com.salao.web.dto.NamedRef;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final SalonServiceRepository salonServiceRepository;
    private final TenantUserRepository tenantUserRepository;
    private final UserRepository userRepository;
    private final TenantResolver tenantResolver;
    private final AuditService auditService;
    private final AvailabilityService availabilityService;
    private final SalonSettingsService salonSettingsService;

    public AppointmentService(
            AppointmentRepository appointmentRepository,
            SalonServiceRepository salonServiceRepository,
            TenantUserRepository tenantUserRepository,
            UserRepository userRepository,
            TenantResolver tenantResolver,
            AuditService auditService,
            AvailabilityService availabilityService,
            SalonSettingsService salonSettingsService) {
        this.appointmentRepository = appointmentRepository;
        this.salonServiceRepository = salonServiceRepository;
        this.tenantUserRepository = tenantUserRepository;
        this.userRepository = userRepository;
        this.tenantResolver = tenantResolver;
        this.auditService = auditService;
        this.availabilityService = availabilityService;
        this.salonSettingsService = salonSettingsService;
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> listAppointments() {
        AuthenticatedUser principal = getAuthenticatedUser();
        Tenant tenant = tenantResolver.requireCurrentTenant();
        User currentUser = userRepository.findByPublicId(principal.getUserPublicId())
                .orElseThrow(ResourceNotFoundException::new);

        List<Appointment> appointments = switch (principal.getRole()) {
            case ADMIN -> appointmentRepository.findAllByTenantIdWithDetails(tenant.getId());
            case PROFESSIONAL -> appointmentRepository.findByTenantIdAndProfessionalIdWithDetails(
                    tenant.getId(), currentUser.getId());
            case CLIENT -> appointmentRepository.findByTenantIdAndClientIdWithDetails(
                    tenant.getId(), currentUser.getId());
        };

        return appointments.stream().map(this::toResponse).toList();
    }

    @Transactional
    public AppointmentResponse createAppointment(CreateAppointmentRequest request) {
        AuthenticatedUser principal = getAuthenticatedUser();
        Tenant tenant = tenantResolver.requireCurrentTenant();

        SalonService service = salonServiceRepository
                .findByPublicIdAndTenantId(request.servicePublicId(), tenant.getId())
                .orElseThrow(ResourceNotFoundException::new);

        if (!service.isActive()) {
            throw new InactiveServiceException();
        }

        User professional = resolveTenantUser(request.professionalPublicId(), tenant.getId()).getUser();
        User client = resolveClient(request, principal, tenant.getId());

        validateCreatePermission(principal, professional, client);

        availabilityService.validateSlotAvailable(tenant, professional, service, request.startAt());

        TenantSchedulingSettings settings = salonSettingsService.requireSchedulingSettingsForTenant(tenant.getId());
        OffsetDateTime endAt = request.startAt().plusMinutes(service.getDurationMinutes());

        Appointment appointment = new Appointment();
        appointment.setTenantId(tenant.getId());
        appointment.setService(service);
        appointment.setProfessional(professional);
        appointment.setClient(client);
        appointment.setBufferMinutes(settings.getBufferMinutes());
        appointment.setStartAt(request.startAt());
        appointment.setEndAt(endAt);
        appointment.setStatus(AppointmentStatus.SCHEDULED);

        Appointment saved = appointmentRepository.save(appointment);
        auditService.record(
                tenant.getId(),
                auditService.resolveCurrentActorUserId(),
                AuditAction.APPOINTMENT_CREATED,
                "Appointment",
                saved.getPublicId(),
                buildAppointmentAuditMetadata(saved));
        return toResponse(saved);
    }

    @Transactional
    public AppointmentResponse cancelAppointment(UUID publicId) {
        AuthenticatedUser principal = getAuthenticatedUser();
        Tenant tenant = tenantResolver.requireCurrentTenant();
        User currentUser = userRepository.findByPublicId(principal.getUserPublicId())
                .orElseThrow(ResourceNotFoundException::new);

        Appointment appointment = appointmentRepository
                .findByPublicIdAndTenantIdWithDetails(publicId, tenant.getId())
                .orElseThrow(ResourceNotFoundException::new);

        validateCancelPermission(principal, appointment, currentUser);

        if (appointment.getStatus() == AppointmentStatus.CANCELLED) {
            return toResponse(appointment);
        }

        appointment.setStatus(AppointmentStatus.CANCELLED);
        Appointment saved = appointmentRepository.save(appointment);
        auditService.record(
                tenant.getId(),
                auditService.resolveCurrentActorUserId(),
                AuditAction.APPOINTMENT_CANCELLED,
                "Appointment",
                saved.getPublicId(),
                buildAppointmentAuditMetadata(saved));
        return toResponse(saved);
    }

    private String buildAppointmentAuditMetadata(Appointment appointment) {
        String clientName = appointment.getClient() != null
                ? appointment.getClient().getName()
                : appointment.getGuestName();
        return "{\"service\":\""
                + escapeJson(appointment.getService().getName())
                + "\",\"startAt\":\""
                + appointment.getStartAt()
                + "\",\"endAt\":\""
                + appointment.getEndAt()
                + "\",\"professional\":\""
                + escapeJson(appointment.getProfessional().getName())
                + "\",\"client\":\""
                + escapeJson(clientName != null ? clientName : "")
                + "\",\"status\":\""
                + appointment.getStatus()
                + "\"}";
    }

    private String escapeJson(String value) {
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    private User resolveClient(CreateAppointmentRequest request, AuthenticatedUser principal, Long tenantId) {
        if (principal.getRole() == Role.CLIENT) {
            return userRepository.findByPublicId(principal.getUserPublicId())
                    .orElseThrow(ResourceNotFoundException::new);
        }

        UUID clientPublicId = request.clientPublicId();
        if (clientPublicId == null) {
            throw new AccessDeniedException();
        }

        return resolveTenantUser(clientPublicId, tenantId).getUser();
    }

    private TenantUser resolveTenantUser(UUID userPublicId, Long tenantId) {
        return tenantUserRepository.findByTenant_IdAndUser_PublicId(tenantId, userPublicId)
                .orElseThrow(ResourceNotFoundException::new);
    }

    private void validateCreatePermission(AuthenticatedUser principal, User professional, User client) {
        switch (principal.getRole()) {
            case ADMIN -> {
            }
            case PROFESSIONAL -> {
                if (!professional.getPublicId().equals(principal.getUserPublicId())) {
                    throw new AccessDeniedException();
                }
            }
            case CLIENT -> {
                if (!client.getPublicId().equals(principal.getUserPublicId())) {
                    throw new AccessDeniedException();
                }
            }
        }
    }

    private void validateCancelPermission(AuthenticatedUser principal, Appointment appointment, User currentUser) {
        switch (principal.getRole()) {
            case ADMIN, PROFESSIONAL -> {
            }
            case CLIENT -> {
                if (appointment.getClient() == null
                        || !appointment.getClient().getId().equals(currentUser.getId())) {
                    throw new AccessDeniedException();
                }
            }
        }
    }

    private AuthenticatedUser getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthenticatedUser authenticatedUser)) {
            throw new InvalidCredentialsException();
        }
        return authenticatedUser;
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
