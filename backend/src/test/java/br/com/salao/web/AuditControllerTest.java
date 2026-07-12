package br.com.salao.web;

import br.com.salao.domain.entity.AuditAction;
import br.com.salao.domain.entity.Role;
import br.com.salao.domain.entity.Tenant;
import br.com.salao.domain.entity.User;
import br.com.salao.domain.repository.AppointmentRepository;
import br.com.salao.domain.repository.AuditLogRepository;
import br.com.salao.domain.repository.SalonServiceRepository;
import br.com.salao.domain.repository.TenantRepository;
import br.com.salao.domain.repository.TenantUserRepository;
import br.com.salao.domain.repository.UserRepository;
import br.com.salao.security.JwtService;
import br.com.salao.service.AuditService;
import br.com.salao.testsupport.TestDataFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuditControllerTest {

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
    private AuditService auditService;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private Tenant tenant;
    private User admin;
    private User professional;
    private String adminToken;
    private String professionalToken;

    @BeforeEach
    void setUp() {
        TestDataFactory.resetDatabase(
                auditLogRepository,
                appointmentRepository,
                salonServiceRepository,
                tenantUserRepository,
                userRepository,
                tenantRepository);

        tenant = TestDataFactory.createTenant(tenantRepository, "audit-salon");
        admin = TestDataFactory.createUser(userRepository, passwordEncoder, "admin@audit.com", "Admin");
        professional = TestDataFactory.createUser(userRepository, passwordEncoder, "pro@audit.com", "Pro");

        TestDataFactory.linkUser(tenantUserRepository, tenant, admin, Role.ADMIN);
        TestDataFactory.linkUser(tenantUserRepository, tenant, professional, Role.PROFESSIONAL);

        adminToken = TestDataFactory.tokenFor(jwtService, admin, tenant, Role.ADMIN);
        professionalToken = TestDataFactory.tokenFor(jwtService, professional, tenant, Role.PROFESSIONAL);

        auditService.record(tenant.getId(), admin.getId(), AuditAction.LOGIN, "User", admin.getPublicId(), null);
        auditService.record(
                tenant.getId(),
                admin.getId(),
                AuditAction.SERVICE_CREATED,
                "Service",
                java.util.UUID.randomUUID(),
                "Corte");
    }

    @Test
    void adminListsAuditLogs() throws Exception {
        mockMvc.perform(get("/audit-logs")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].publicId").exists())
                .andExpect(jsonPath("$[0].action").exists())
                .andExpect(jsonPath("$[0].createdAt").exists());
    }

    @Test
    void adminFiltersAuditLogsByAction() throws Exception {
        mockMvc.perform(get("/audit-logs")
                        .param("action", "LOGIN")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].action").value("LOGIN"))
                .andExpect(jsonPath("$[0].actor.name").value("Admin"));
    }

    @Test
    void nonAdminCannotListAuditLogs() throws Exception {
        mockMvc.perform(get("/audit-logs")
                        .header("Authorization", "Bearer " + professionalToken))
                .andExpect(status().isForbidden());
    }
}
