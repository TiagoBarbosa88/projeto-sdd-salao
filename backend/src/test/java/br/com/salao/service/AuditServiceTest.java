package br.com.salao.service;

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
import br.com.salao.testsupport.TestDataFactory;
import br.com.salao.testsupport.TestRepositories;
import br.com.salao.security.TenantContext;
import br.com.salao.web.dto.AuditLogResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class AuditServiceTest {

    @Autowired
    private AuditService auditService;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private TestRepositories testRepositories;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private SalonServiceRepository salonServiceRepository;

    @Autowired
    private TenantRepository tenantRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TenantUserRepository tenantUserRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private Tenant tenant;
    private User admin;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        TestDataFactory.resetDatabase(
                testRepositories,
                auditLogRepository,
                appointmentRepository,
                salonServiceRepository,
                tenantUserRepository,
                userRepository,
                tenantRepository);

        tenant = TestDataFactory.createTenant(tenantRepository, "audit-service");
        admin = TestDataFactory.createUser(userRepository, passwordEncoder, "admin@audit-service.com", "Admin");
        TestDataFactory.linkUser(tenantUserRepository, tenant, admin, Role.ADMIN);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
        SecurityContextHolder.clearContext();
    }

    @Test
    void recordsAndListsAuditEntry() {
        UUID entityId = UUID.randomUUID();
        auditService.record(tenant.getId(), admin.getId(), AuditAction.SERVICE_CREATED, "Service", entityId, "Corte");

        setAdminContext();
        List<AuditLogResponse> logs = auditService.listLogs(null);

        assertThat(logs).hasSize(1);
        assertThat(logs.getFirst().action()).isEqualTo(AuditAction.SERVICE_CREATED);
        assertThat(logs.getFirst().entityPublicId()).isEqualTo(entityId);
        assertThat(logs.getFirst().actor().name()).isEqualTo("Admin");
    }

    @Test
    void filtersByAction() {
        auditService.record(tenant.getId(), admin.getId(), AuditAction.LOGIN, "User", admin.getPublicId(), null);
        auditService.record(
                tenant.getId(),
                admin.getId(),
                AuditAction.APPOINTMENT_CREATED,
                "Appointment",
                UUID.randomUUID(),
                null);

        setAdminContext();
        List<AuditLogResponse> logs = auditService.listLogs(AuditAction.LOGIN);

        assertThat(logs).hasSize(1);
        assertThat(logs.getFirst().action()).isEqualTo(AuditAction.LOGIN);
    }

    private void setAdminContext() {
        TenantContext.set(tenant.getPublicId());
        var principal = new br.com.salao.security.AuthenticatedUser(
                admin.getPublicId(), tenant.getPublicId(), admin.getEmail(), Role.ADMIN);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));
    }
}
