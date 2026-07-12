package br.com.salao.service;

import br.com.salao.domain.entity.Appointment;
import br.com.salao.domain.entity.AppointmentStatus;
import br.com.salao.domain.entity.Role;
import br.com.salao.domain.entity.SalonService;
import br.com.salao.domain.entity.Tenant;
import br.com.salao.domain.entity.TenantUser;
import br.com.salao.domain.entity.User;
import br.com.salao.domain.repository.AppointmentRepository;
import br.com.salao.domain.repository.SalonServiceRepository;
import br.com.salao.domain.repository.TenantUserRepository;
import br.com.salao.domain.repository.UserRepository;
import br.com.salao.security.AuthenticatedUser;
import br.com.salao.web.dto.AppointmentResponse;
import br.com.salao.web.dto.CreateAppointmentRequest;
import br.com.salao.web.dto.UuidRef;
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

    public AppointmentService(
            AppointmentRepository appointmentRepository,
            SalonServiceRepository salonServiceRepository,
            TenantUserRepository tenantUserRepository,
            UserRepository userRepository,
            TenantResolver tenantResolver) {
        this.appointmentRepository = appointmentRepository;
        this.salonServiceRepository = salonServiceRepository;
        this.tenantUserRepository = tenantUserRepository;
        this.userRepository = userRepository;
        this.tenantResolver = tenantResolver;
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

        OffsetDateTime endAt = request.startAt().plusMinutes(service.getDurationMinutes());

        if (appointmentRepository.existsConflict(
                tenant.getId(),
                professional.getId(),
                request.startAt(),
                endAt,
                AppointmentStatus.CANCELLED)) {
            throw new AppointmentConflictException();
        }

        Appointment appointment = new Appointment();
        appointment.setTenantId(tenant.getId());
        appointment.setService(service);
        appointment.setProfessional(professional);
        appointment.setClient(client);
        appointment.setStartAt(request.startAt());
        appointment.setEndAt(endAt);
        appointment.setStatus(AppointmentStatus.SCHEDULED);

        return toResponse(appointmentRepository.save(appointment));
    }

    @Transactional
    public AppointmentResponse cancelAppointment(UUID publicId) {
        AuthenticatedUser principal = getAuthenticatedUser();
        Tenant tenant = tenantResolver.requireCurrentTenant();
        User currentUser = userRepository.findByPublicId(principal.getUserPublicId())
                .orElseThrow(ResourceNotFoundException::new);

        Appointment appointment = appointmentRepository.findByPublicIdAndTenantId(publicId, tenant.getId())
                .orElseThrow(ResourceNotFoundException::new);

        validateCancelPermission(principal, appointment, currentUser);

        if (appointment.getStatus() == AppointmentStatus.CANCELLED) {
            return toResponse(appointment);
        }

        appointment.setStatus(AppointmentStatus.CANCELLED);
        return toResponse(appointmentRepository.save(appointment));
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
                if (!appointment.getClient().getId().equals(currentUser.getId())) {
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
        return new AppointmentResponse(
                appointment.getPublicId(),
                new UuidRef(appointment.getService().getPublicId()),
                new UuidRef(appointment.getProfessional().getPublicId()),
                new UuidRef(appointment.getClient().getPublicId()),
                appointment.getStartAt(),
                appointment.getEndAt(),
                appointment.getStatus(),
                appointment.getCreatedAt()
        );
    }
}
