package br.com.salao.service;

import br.com.salao.domain.entity.AppointmentStatus;
import br.com.salao.domain.entity.Role;
import br.com.salao.domain.entity.SalonService;
import br.com.salao.domain.entity.Tenant;
import br.com.salao.domain.entity.TenantUser;
import br.com.salao.domain.entity.User;
import br.com.salao.domain.repository.AppointmentRepository;
import br.com.salao.domain.repository.AuditLogRepository;
import br.com.salao.domain.repository.ProfessionalBlockedPeriodRepository;
import br.com.salao.domain.repository.ProfessionalProfileRepository;
import br.com.salao.domain.repository.ProfessionalWorkingPeriodRepository;
import br.com.salao.domain.repository.SalonServiceRepository;
import br.com.salao.domain.repository.TenantRepository;
import br.com.salao.domain.repository.TenantSchedulingSettingsRepository;
import br.com.salao.domain.repository.TenantUserRepository;
import br.com.salao.domain.repository.UserRepository;
import br.com.salao.security.AuthenticatedUser;
import br.com.salao.security.TenantContext;
import br.com.salao.testsupport.TestDataFactory;
import br.com.salao.testsupport.TestRepositories;
import br.com.salao.web.dto.CreateAppointmentRequest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
class AvailabilityServiceTest {

    @Autowired
    private AvailabilityService availabilityService;

    @Autowired
    private AppointmentService appointmentService;

    @Autowired
    private TenantRepository tenantRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TenantUserRepository tenantUserRepository;

    @Autowired
    private SalonServiceRepository salonServiceRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private TestRepositories testRepositories;

    @Autowired
    private TenantSchedulingSettingsRepository schedulingSettingsRepository;

    @Autowired
    private ProfessionalProfileRepository professionalProfileRepository;

    @Autowired
    private ProfessionalWorkingPeriodRepository workingPeriodRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private Tenant tenant;
    private User admin;
    private User professional;
    private User client;
    private SalonService service;
    private TenantUser professionalTenantUser;

    @BeforeEach
    void setUp() {
        TestDataFactory.resetDatabase(
                testRepositories,
                auditLogRepository,
                appointmentRepository,
                salonServiceRepository,
                tenantUserRepository,
                userRepository,
                tenantRepository);

        tenant = TestDataFactory.createTenant(tenantRepository, "avail-svc-salon");
        admin = TestDataFactory.createUser(userRepository, passwordEncoder, "admin@avail.com", "Admin");
        professional = TestDataFactory.createUser(userRepository, passwordEncoder, "pro@avail.com", "Pro");
        client = TestDataFactory.createUser(userRepository, passwordEncoder, "client@avail.com", "Cliente");

        TestDataFactory.linkUser(tenantUserRepository, tenant, admin, Role.ADMIN);
        professionalTenantUser = TestDataFactory.linkUser(tenantUserRepository, tenant, professional, Role.PROFESSIONAL);
        TestDataFactory.linkUser(tenantUserRepository, tenant, client, Role.CLIENT);

        TestDataFactory.seedSchedulingForTenant(
                schedulingSettingsRepository,
                professionalProfileRepository,
                workingPeriodRepository,
                tenant,
                professionalTenantUser);

        service = new SalonService();
        service.setTenantId(tenant.getId());
        service.setName("Corte");
        service.setDurationMinutes(30);
        service.setPrice(new BigDecimal("50.00"));
        service.setActive(true);
        service = salonServiceRepository.save(service);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
        SecurityContextHolder.clearContext();
    }

    @Test
    void returnsSlotsWithinWorkingHours() {
        LocalDate date = LocalDate.now(ZoneId.of("America/Sao_Paulo")).plusDays(1);
        while (date.getDayOfWeek().getValue() > 6) {
            date = date.plusDays(1);
        }

        var slots = availabilityService.getAvailableSlotsBySlug(
                tenant.getSlug(),
                professional.getPublicId(),
                service.getPublicId(),
                date);

        assertThat(slots).isNotEmpty();
        ZoneId zone = ZoneId.of("America/Sao_Paulo");
        assertThat(slots.getFirst().startAt().atZoneSameInstant(zone).toLocalTime())
                .isAfterOrEqualTo(LocalTime.of(9, 0));
    }

    @Test
    void bookedSlotIsRemovedFromAvailability() {
        LocalDate date = LocalDate.now(ZoneId.of("America/Sao_Paulo")).plusDays(2);
        while (date.getDayOfWeek().getValue() > 6) {
            date = date.plusDays(1);
        }

        ZoneId zone = ZoneId.of("America/Sao_Paulo");
        OffsetDateTime startAt = date.atTime(10, 0).atZone(zone).toOffsetDateTime();

        authenticateAs(admin, Role.ADMIN);
        TenantContext.set(tenant.getPublicId());
        appointmentService.createAppointment(new CreateAppointmentRequest(
                service.getPublicId(),
                professional.getPublicId(),
                client.getPublicId(),
                startAt
        ));

        var slots = availabilityService.getAvailableSlotsBySlug(
                tenant.getSlug(),
                professional.getPublicId(),
                service.getPublicId(),
                date);

        assertThat(slots.stream().map(s -> s.startAt().toInstant()))
                .doesNotContain(startAt.toInstant());
    }

    @Test
    void validateSlotAvailableRejectsConflictingTime() {
        ZoneId zone = ZoneId.of("America/Sao_Paulo");
        LocalDate date = LocalDate.now(zone).plusDays(3);
        while (date.getDayOfWeek().getValue() > 6) {
            date = date.plusDays(1);
        }
        OffsetDateTime startAt = date.atTime(14, 0).atZone(zone).toOffsetDateTime();

        authenticateAs(admin, Role.ADMIN);
        TenantContext.set(tenant.getPublicId());
        appointmentService.createAppointment(new CreateAppointmentRequest(
                service.getPublicId(),
                professional.getPublicId(),
                client.getPublicId(),
                startAt
        ));

        assertThatThrownBy(() -> availabilityService.validateSlotAvailable(tenant, professional, service, startAt))
                .isInstanceOf(SlotUnavailableException.class);
    }

    private void authenticateAs(User user, Role role) {
        AuthenticatedUser principal = new AuthenticatedUser(
                user.getPublicId(),
                tenant.getPublicId(),
                user.getEmail(),
                role
        );
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities())
        );
    }
}
