package br.com.salao.service;

import br.com.salao.domain.entity.ProfessionalProfile;
import br.com.salao.domain.entity.ProfessionalWorkingPeriod;
import br.com.salao.domain.entity.Role;
import br.com.salao.domain.entity.Tenant;
import br.com.salao.domain.entity.TenantUser;
import br.com.salao.domain.entity.User;
import br.com.salao.domain.repository.ProfessionalProfileRepository;
import br.com.salao.domain.repository.ProfessionalWorkingPeriodRepository;
import br.com.salao.domain.repository.TenantUserRepository;
import br.com.salao.domain.repository.UserRepository;
import br.com.salao.web.dto.CreateTeamMemberRequest;
import br.com.salao.web.dto.ProfessionalResponse;
import br.com.salao.web.dto.TeamMemberResponse;
import br.com.salao.web.dto.UpdateProfessionalProfileRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@Service
public class TeamService {

    private static final LocalTime DEFAULT_START = LocalTime.of(9, 0);
    private static final LocalTime DEFAULT_END = LocalTime.of(22, 0);

    private final TenantUserRepository tenantUserRepository;
    private final UserRepository userRepository;
    private final ProfessionalProfileRepository professionalProfileRepository;
    private final ProfessionalWorkingPeriodRepository workingPeriodRepository;
    private final TenantResolver tenantResolver;
    private final PasswordEncoder passwordEncoder;

    public TeamService(
            TenantUserRepository tenantUserRepository,
            UserRepository userRepository,
            ProfessionalProfileRepository professionalProfileRepository,
            ProfessionalWorkingPeriodRepository workingPeriodRepository,
            TenantResolver tenantResolver,
            PasswordEncoder passwordEncoder) {
        this.tenantUserRepository = tenantUserRepository;
        this.userRepository = userRepository;
        this.professionalProfileRepository = professionalProfileRepository;
        this.workingPeriodRepository = workingPeriodRepository;
        this.tenantResolver = tenantResolver;
        this.passwordEncoder = passwordEncoder;
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

    @Transactional(readOnly = true)
    public List<ProfessionalResponse> listBookableProfessionals() {
        Tenant tenant = tenantResolver.requireCurrentTenant();
        return professionalProfileRepository.findBookableByTenantId(tenant.getId()).stream()
                .map(this::toProfessionalResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    @PreAuthorize("hasRole('ADMIN')")
    public List<ProfessionalResponse> listAllProfessionalProfiles() {
        Tenant tenant = tenantResolver.requireCurrentTenant();
        return professionalProfileRepository.findAllByTenantId(tenant.getId()).stream()
                .map(this::toProfessionalResponse)
                .toList();
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public ProfessionalResponse createProfessional(CreateTeamMemberRequest request) {
        if (request.email() == null || request.email().isBlank()
                || request.password() == null || request.password().isBlank()
                || request.name() == null || request.name().isBlank()) {
            throw new InvalidScheduleException();
        }
        if (userRepository.existsByEmail(request.email())) {
            throw new EmailAlreadyExistsException();
        }

        Tenant tenant = tenantResolver.requireCurrentTenant();

        User user = new User();
        user.setEmail(request.email());
        user.setName(request.name());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user = userRepository.save(user);

        TenantUser tenantUser = new TenantUser();
        tenantUser.setTenant(tenant);
        tenantUser.setUser(user);
        tenantUser.setRole(Role.PROFESSIONAL);
        tenantUser = tenantUserRepository.save(tenantUser);

        ProfessionalProfile profile = new ProfessionalProfile();
        profile.setTenantUser(tenantUser);
        profile.setPhone(request.phone());
        profile.setBookable(request.bookable());
        profile = professionalProfileRepository.save(profile);

        createDefaultWorkingPeriods(tenantUser);

        return toProfessionalResponse(profile);
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public ProfessionalResponse updateProfessionalProfile(UUID userPublicId, UpdateProfessionalProfileRequest request) {
        Tenant tenant = tenantResolver.requireCurrentTenant();
        ProfessionalProfile profile = professionalProfileRepository
                .findByTenantIdAndUserPublicId(tenant.getId(), userPublicId)
                .orElseThrow(ResourceNotFoundException::new);

        if (request.phone() != null) {
            profile.setPhone(request.phone());
        }
        if (request.bookable() != null) {
            profile.setBookable(request.bookable());
        }
        if (request.active() != null) {
            profile.setActive(request.active());
        }

        return toProfessionalResponse(professionalProfileRepository.save(profile));
    }

    void createDefaultWorkingPeriods(TenantUser tenantUser) {
        for (int day = 1; day <= 6; day++) {
            ProfessionalWorkingPeriod period = new ProfessionalWorkingPeriod();
            period.setTenantUser(tenantUser);
            period.setDayOfWeek(day);
            period.setStartTime(DEFAULT_START);
            period.setEndTime(DEFAULT_END);
            workingPeriodRepository.save(period);
        }
    }

    private ProfessionalResponse toProfessionalResponse(ProfessionalProfile profile) {
        User user = profile.getTenantUser().getUser();
        return new ProfessionalResponse(
                user.getPublicId(),
                user.getName(),
                profile.getPhone(),
                profile.isBookable(),
                profile.isActive()
        );
    }
}
