package br.com.salao.service;

import br.com.salao.domain.entity.Role;
import br.com.salao.domain.entity.Tenant;
import br.com.salao.domain.entity.User;
import br.com.salao.domain.repository.AppointmentRepository;
import br.com.salao.domain.repository.AuditLogRepository;
import br.com.salao.domain.repository.SalonServiceRepository;
import br.com.salao.domain.repository.TenantRepository;
import br.com.salao.domain.repository.TenantUserRepository;
import br.com.salao.domain.repository.UserRepository;
import br.com.salao.security.AuthenticatedUser;
import br.com.salao.security.TenantContext;
import br.com.salao.testsupport.TestDataFactory;
import br.com.salao.web.dto.CreateServiceRequest;
import br.com.salao.web.dto.UpdateServiceRequest;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
class ServiceCatalogServiceTest {

    @Autowired
    private ServiceCatalogService serviceCatalogService;

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
    private PasswordEncoder passwordEncoder;

    private Tenant tenant;
    private User admin;

    @BeforeEach
    void setUp() {
        TestDataFactory.resetDatabase(
                auditLogRepository,
                appointmentRepository,
                salonServiceRepository,
                tenantUserRepository,
                userRepository,
                tenantRepository);

        tenant = TestDataFactory.createTenant(tenantRepository, "catalog-salon");
        admin = TestDataFactory.createUser(userRepository, passwordEncoder, "admin@catalog.com", "Admin");
        TestDataFactory.linkUser(tenantUserRepository, tenant, admin, Role.ADMIN);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
        SecurityContextHolder.clearContext();
    }

    @Test
    void adminCanManageServicesForCurrentTenant() {
        authenticateAs(admin, Role.ADMIN);
        TenantContext.set(tenant.getPublicId());

        var created = serviceCatalogService.createService(new CreateServiceRequest(
                "Escova",
                "Escova modeladora",
                40,
                new BigDecimal("55.00")
        ));

        assertThat(created.publicId()).isNotNull();
        assertThat(created.active()).isTrue();

        var listed = serviceCatalogService.listServices();
        assertThat(listed).hasSize(1);

        var updated = serviceCatalogService.updateService(created.publicId(), new UpdateServiceRequest(
                "Escova Premium",
                "Nova descricao",
                50,
                new BigDecimal("65.00"),
                true
        ));
        assertThat(updated.name()).isEqualTo("Escova Premium");

        serviceCatalogService.deactivateService(created.publicId());
        assertThat(serviceCatalogService.getService(created.publicId()).active()).isFalse();
    }

    @Test
    void nonAdminCannotCreateService() {
        User client = TestDataFactory.createUser(userRepository, passwordEncoder, "client@catalog.com", "Cliente");
        TestDataFactory.linkUser(tenantUserRepository, tenant, client, Role.CLIENT);
        authenticateAs(client, Role.CLIENT);
        TenantContext.set(tenant.getPublicId());

        assertThatThrownBy(() -> serviceCatalogService.createService(new CreateServiceRequest(
                "Manicure",
                null,
                30,
                new BigDecimal("35.00")
        ))).isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
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
