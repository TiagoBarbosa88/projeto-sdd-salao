package br.com.salao.web;

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
import br.com.salao.security.JwtService;
import br.com.salao.testsupport.TestDataFactory;
import br.com.salao.testsupport.TestRepositories;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class DashboardControllerTest {

    @Autowired
    private MockMvc mockMvc;

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
    private JwtService jwtService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private String adminToken;

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

        Tenant tenant = TestDataFactory.createTenant(tenantRepository, "dash-salon");
        User admin = TestDataFactory.createUser(userRepository, passwordEncoder, "admin@dash.com", "Admin");
        User professional = TestDataFactory.createUser(userRepository, passwordEncoder, "pro@dash.com", "Pro");
        User client = TestDataFactory.createUser(userRepository, passwordEncoder, "client@dash.com", "Cliente");

        TestDataFactory.linkUser(tenantUserRepository, tenant, admin, Role.ADMIN);
        TestDataFactory.linkUser(tenantUserRepository, tenant, professional, Role.PROFESSIONAL);
        TestDataFactory.linkUser(tenantUserRepository, tenant, client, Role.CLIENT);

        SalonService service = new SalonService();
        service.setTenantId(tenant.getId());
        service.setName("Corte");
        service.setDurationMinutes(60);
        service.setPrice(new BigDecimal("80.00"));
        service.setActive(true);
        service = salonServiceRepository.save(service);

        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        OffsetDateTime startAt = today.atTime(10, 0).atOffset(ZoneOffset.UTC);

        Appointment appointment = new Appointment();
        appointment.setTenantId(tenant.getId());
        appointment.setService(service);
        appointment.setProfessional(professional);
        appointment.setClient(client);
        appointment.setStartAt(startAt);
        appointment.setEndAt(startAt.plusMinutes(60));
        appointment.setStatus(AppointmentStatus.SCHEDULED);
        appointmentRepository.save(appointment);

        adminToken = TestDataFactory.tokenFor(jwtService, admin, tenant, Role.ADMIN);
    }

    @Test
    void summaryReturnsTodayMetrics() throws Exception {
        mockMvc.perform(get("/dashboard/summary")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.appointmentsToday").value(1))
                .andExpect(jsonPath("$.estimatedRevenue").value(80.00))
                .andExpect(jsonPath("$.occupancyRate").isNumber());
    }
}
