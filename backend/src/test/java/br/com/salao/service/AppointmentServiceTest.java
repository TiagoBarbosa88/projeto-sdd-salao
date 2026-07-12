package br.com.salao.service;

import br.com.salao.domain.entity.AppointmentStatus;
import br.com.salao.domain.entity.Role;
import br.com.salao.domain.entity.SalonService;
import br.com.salao.domain.entity.Tenant;
import br.com.salao.domain.entity.User;
import br.com.salao.domain.repository.AppointmentRepository;
import br.com.salao.domain.repository.SalonServiceRepository;
import br.com.salao.domain.repository.TenantRepository;
import br.com.salao.domain.repository.TenantUserRepository;
import br.com.salao.domain.repository.UserRepository;
import br.com.salao.security.AuthenticatedUser;
import br.com.salao.security.TenantContext;
import br.com.salao.testsupport.TestDataFactory;
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
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
class AppointmentServiceTest {

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
    private PasswordEncoder passwordEncoder;

    private Tenant tenant;
    private User admin;
    private User professional;
    private User client;
    private SalonService service;

    @BeforeEach
    void setUp() {
        appointmentRepository.deleteAll();
        salonServiceRepository.deleteAll();
        tenantUserRepository.deleteAll();
        userRepository.deleteAll();
        tenantRepository.deleteAll();

        tenant = TestDataFactory.createTenant(tenantRepository, "appt-svc-salon");
        admin = TestDataFactory.createUser(userRepository, passwordEncoder, "admin@apptsvc.com", "Admin");
        professional = TestDataFactory.createUser(userRepository, passwordEncoder, "pro@apptsvc.com", "Pro");
        client = TestDataFactory.createUser(userRepository, passwordEncoder, "client@apptsvc.com", "Cliente");

        TestDataFactory.linkUser(tenantUserRepository, tenant, admin, Role.ADMIN);
        TestDataFactory.linkUser(tenantUserRepository, tenant, professional, Role.PROFESSIONAL);
        TestDataFactory.linkUser(tenantUserRepository, tenant, client, Role.CLIENT);

        service = new SalonService();
        service.setTenantId(tenant.getId());
        service.setName("Coloracao");
        service.setDurationMinutes(60);
        service.setPrice(new BigDecimal("120.00"));
        service.setActive(true);
        service = salonServiceRepository.save(service);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
        SecurityContextHolder.clearContext();
    }

    @Test
    void rejectsOverlappingAppointmentsForSameProfessional() {
        authenticateAs(admin, Role.ADMIN);
        TenantContext.set(tenant.getPublicId());

        OffsetDateTime startAt = OffsetDateTime.now(ZoneOffset.UTC).plusDays(3).withHour(11).withMinute(0).withSecond(0).withNano(0);

        CreateAppointmentRequest request = new CreateAppointmentRequest(
                service.getPublicId(),
                professional.getPublicId(),
                client.getPublicId(),
                startAt
        );

        appointmentService.createAppointment(request);

        assertThatThrownBy(() -> appointmentService.createAppointment(request))
                .isInstanceOf(AppointmentConflictException.class);
    }

    @Test
    void clientSeesOnlyOwnAppointments() {
        authenticateAs(admin, Role.ADMIN);
        TenantContext.set(tenant.getPublicId());

        OffsetDateTime startAt = OffsetDateTime.now(ZoneOffset.UTC).plusDays(4).withHour(15).withMinute(0).withSecond(0).withNano(0);
        appointmentService.createAppointment(new CreateAppointmentRequest(
                service.getPublicId(),
                professional.getPublicId(),
                client.getPublicId(),
                startAt
        ));

        authenticateAs(client, Role.CLIENT);
        TenantContext.set(tenant.getPublicId());

        assertThat(appointmentService.listAppointments()).hasSize(1);

        User otherClient = TestDataFactory.createUser(userRepository, passwordEncoder, "other@apptsvc.com", "Outro");
        TestDataFactory.linkUser(tenantUserRepository, tenant, otherClient, Role.CLIENT);

        authenticateAs(otherClient, Role.CLIENT);
        TenantContext.set(tenant.getPublicId());

        assertThat(appointmentService.listAppointments()).isEmpty();
    }

    @Test
    void listAppointmentsReturnsNamedRefs() {
        authenticateAs(admin, Role.ADMIN);
        TenantContext.set(tenant.getPublicId());

        OffsetDateTime startAt = OffsetDateTime.now(ZoneOffset.UTC).plusDays(6).withHour(10).withMinute(0).withSecond(0).withNano(0);
        appointmentService.createAppointment(new CreateAppointmentRequest(
                service.getPublicId(),
                professional.getPublicId(),
                client.getPublicId(),
                startAt
        ));

        var appointments = appointmentService.listAppointments();

        assertThat(appointments).hasSize(1);
        assertThat(appointments.getFirst().service().name()).isEqualTo("Coloracao");
        assertThat(appointments.getFirst().professional().name()).isEqualTo("Pro");
        assertThat(appointments.getFirst().client().name()).isEqualTo("Cliente");
    }

    @Test
    void cancelledAppointmentsDoNotBlockNewSlot() {
        authenticateAs(admin, Role.ADMIN);
        TenantContext.set(tenant.getPublicId());

        OffsetDateTime startAt = OffsetDateTime.now(ZoneOffset.UTC).plusDays(5).withHour(16).withMinute(0).withSecond(0).withNano(0);

        var created = appointmentService.createAppointment(new CreateAppointmentRequest(
                service.getPublicId(),
                professional.getPublicId(),
                client.getPublicId(),
                startAt
        ));

        appointmentService.cancelAppointment(created.publicId());

        var replacement = appointmentService.createAppointment(new CreateAppointmentRequest(
                service.getPublicId(),
                professional.getPublicId(),
                client.getPublicId(),
                startAt
        ));

        assertThat(replacement.status()).isEqualTo(AppointmentStatus.SCHEDULED);
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
