package br.com.salao.service;

import br.com.salao.domain.entity.Appointment;
import br.com.salao.domain.entity.AppointmentStatus;
import br.com.salao.domain.entity.Role;
import br.com.salao.domain.entity.SalonService;
import br.com.salao.domain.entity.Tenant;
import br.com.salao.domain.entity.User;
import br.com.salao.domain.repository.AppointmentRepository;
import br.com.salao.domain.repository.AuditLogRepository;
import br.com.salao.domain.repository.SalonServiceRepository;
import br.com.salao.domain.repository.TenantRepository;
import br.com.salao.domain.repository.TenantUserRepository;
import br.com.salao.domain.repository.UserRepository;
import br.com.salao.security.TenantContext;
import br.com.salao.testsupport.TestDataFactory;
import br.com.salao.testsupport.TestRepositories;
import br.com.salao.web.dto.DashboardSummaryResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class DashboardServiceTest {

    @Autowired
    private DashboardService dashboardService;

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
    private PasswordEncoder passwordEncoder;

    private Tenant tenant;

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

        tenant = TestDataFactory.createTenant(tenantRepository, "dash-svc-salon");
        User professional = TestDataFactory.createUser(userRepository, passwordEncoder, "pro@dashsvc.com", "Pro");
        User client = TestDataFactory.createUser(userRepository, passwordEncoder, "client@dashsvc.com", "Cliente");
        TestDataFactory.linkUser(tenantUserRepository, tenant, professional, Role.PROFESSIONAL);
        TestDataFactory.linkUser(tenantUserRepository, tenant, client, Role.CLIENT);

        SalonService service = new SalonService();
        service.setTenantId(tenant.getId());
        service.setName("Manicure");
        service.setDurationMinutes(30);
        service.setPrice(new BigDecimal("40.00"));
        service.setActive(true);
        service = salonServiceRepository.save(service);

        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        OffsetDateTime startAt = today.atTime(14, 0).atOffset(ZoneOffset.UTC);

        Appointment appointment = new Appointment();
        appointment.setTenantId(tenant.getId());
        appointment.setService(service);
        appointment.setProfessional(professional);
        appointment.setClient(client);
        appointment.setStartAt(startAt);
        appointment.setEndAt(startAt.plusMinutes(30));
        appointment.setStatus(AppointmentStatus.SCHEDULED);
        appointmentRepository.save(appointment);

        TenantContext.set(tenant.getPublicId());
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void calculatesSummaryForCurrentUtcDay() {
        DashboardSummaryResponse summary = dashboardService.getSummary();

        assertThat(summary.appointmentsToday()).isEqualTo(1);
        assertThat(summary.estimatedRevenue()).isEqualByComparingTo(new BigDecimal("40.00"));
        assertThat(summary.occupancyRate()).isBetween(0.0, 1.0);
    }

    @Test
    void excludesCancelledAppointmentsFromSummary() {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        OffsetDateTime startAt = today.atTime(16, 0).atOffset(ZoneOffset.UTC);

        Appointment cancelled = appointmentRepository.findAll().getFirst();
        cancelled.setStatus(AppointmentStatus.CANCELLED);
        appointmentRepository.save(cancelled);

        Appointment replacement = new Appointment();
        replacement.setTenantId(tenant.getId());
        replacement.setService(cancelled.getService());
        replacement.setProfessional(cancelled.getProfessional());
        replacement.setClient(cancelled.getClient());
        replacement.setStartAt(startAt);
        replacement.setEndAt(startAt.plusMinutes(30));
        replacement.setStatus(AppointmentStatus.CANCELLED);
        appointmentRepository.save(replacement);

        DashboardSummaryResponse summary = dashboardService.getSummary();

        assertThat(summary.appointmentsToday()).isZero();
        assertThat(summary.estimatedRevenue()).isEqualByComparingTo(BigDecimal.ZERO);
    }
}
