package br.com.salao.web;

import br.com.salao.domain.entity.SalonService;
import br.com.salao.domain.entity.Tenant;
import br.com.salao.domain.repository.AppointmentRepository;
import br.com.salao.domain.repository.AuditLogRepository;
import br.com.salao.domain.repository.SalonServiceRepository;
import br.com.salao.domain.repository.TenantRepository;
import br.com.salao.domain.repository.TenantUserRepository;
import br.com.salao.domain.repository.UserRepository;
import br.com.salao.testsupport.TestDataFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PublicTenantControllerTest {

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

    private Tenant tenant;

    @BeforeEach
    void setUp() {
        TestDataFactory.resetDatabase(
                auditLogRepository,
                appointmentRepository,
                salonServiceRepository,
                tenantUserRepository,
                userRepository,
                tenantRepository);

        tenant = TestDataFactory.createTenant(tenantRepository, "studio-bella");

        SalonService active = new SalonService();
        active.setTenantId(tenant.getId());
        active.setName("Corte");
        active.setDescription("Corte masculino");
        active.setDurationMinutes(30);
        active.setPrice(new BigDecimal("45.00"));
        active.setActive(true);
        salonServiceRepository.save(active);

        SalonService inactive = new SalonService();
        inactive.setTenantId(tenant.getId());
        inactive.setName("Escova antiga");
        inactive.setDurationMinutes(60);
        inactive.setPrice(new BigDecimal("80.00"));
        inactive.setActive(false);
        salonServiceRepository.save(inactive);
    }

    @Test
    void returnsPublicTenantWithoutAuth() throws Exception {
        mockMvc.perform(get("/public/tenants/studio-bella"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Salao studio-bella"))
                .andExpect(jsonPath("$.slug").value("studio-bella"))
                .andExpect(jsonPath("$.publicId").exists());
    }

    @Test
    void returnsOnlyActiveServicesWithoutAuth() throws Exception {
        mockMvc.perform(get("/public/tenants/studio-bella/services"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].name").value("Corte"))
                .andExpect(jsonPath("$[0].price").value(45.0));
    }

    @Test
    void returnsNotFoundForUnknownSlug() throws Exception {
        mockMvc.perform(get("/public/tenants/inexistente"))
                .andExpect(status().isNotFound());
    }
}
