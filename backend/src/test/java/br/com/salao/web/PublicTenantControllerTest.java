package br.com.salao.web;

import br.com.salao.domain.entity.Role;
import br.com.salao.domain.entity.SalonService;
import br.com.salao.domain.entity.Tenant;
import br.com.salao.domain.entity.TenantUser;
import br.com.salao.domain.entity.User;
import br.com.salao.domain.repository.AppointmentRepository;
import br.com.salao.domain.repository.AuditLogRepository;
import br.com.salao.domain.repository.ProfessionalProfileRepository;
import br.com.salao.domain.repository.ProfessionalWorkingPeriodRepository;
import br.com.salao.domain.repository.SalonServiceRepository;
import br.com.salao.domain.repository.TenantRepository;
import br.com.salao.domain.repository.TenantSchedulingSettingsRepository;
import br.com.salao.domain.repository.TenantUserRepository;
import br.com.salao.domain.repository.UserRepository;
import br.com.salao.testsupport.TestDataFactory;
import br.com.salao.testsupport.TestRepositories;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Map;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PublicTenantControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private PasswordEncoder passwordEncoder;

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

    private Tenant tenant;
    private User professional;
    private SalonService activeService;
    private static final ZoneId ZONE = ZoneId.of("America/Sao_Paulo");

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

        tenant = TestDataFactory.createTenant(tenantRepository, "studio-bella");
        tenant.setSeoTitle("Studio Bella SEO");
        tenant.setDescription("Salao premium");
        tenant = tenantRepository.save(tenant);

        professional = TestDataFactory.createUser(userRepository, passwordEncoder, "pro@studio.com", "Ana Pro");
        TenantUser professionalTenantUser = TestDataFactory.linkUser(
                tenantUserRepository, tenant, professional, Role.PROFESSIONAL);
        TestDataFactory.seedSchedulingForTenant(
                schedulingSettingsRepository,
                professionalProfileRepository,
                workingPeriodRepository,
                tenant,
                professionalTenantUser);

        activeService = new SalonService();
        activeService.setTenantId(tenant.getId());
        activeService.setName("Corte");
        activeService.setDescription("Corte masculino");
        activeService.setDurationMinutes(30);
        activeService.setPrice(new BigDecimal("45.00"));
        activeService.setActive(true);
        activeService = salonServiceRepository.save(activeService);

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
                .andExpect(jsonPath("$.publicId").exists())
                .andExpect(jsonPath("$.seoTitle").value("Studio Bella SEO"))
                .andExpect(jsonPath("$.description").value("Salao premium"))
                .andExpect(jsonPath("$.businessHoursLines", hasSize(1)))
                .andExpect(jsonPath("$.businessHoursLines[0]").value("Segunda a Sabado das 9h as 22h"));
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

    @Test
    void returnsBookableProfessionalsWithoutAuth() throws Exception {
        mockMvc.perform(get("/public/tenants/studio-bella/professionals"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].name").value("Ana Pro"))
                .andExpect(jsonPath("$[0].publicId").value(professional.getPublicId().toString()));
    }

    @Test
    void returnsAvailabilitySlotsWithoutAuth() throws Exception {
        LocalDate date = LocalDate.now(ZONE).plusDays(1);
        while (date.getDayOfWeek().getValue() > 6) {
            date = date.plusDays(1);
        }

        mockMvc.perform(get("/public/tenants/studio-bella/availability/slots")
                        .param("professionalPublicId", professional.getPublicId().toString())
                        .param("servicePublicId", activeService.getPublicId().toString())
                        .param("date", date.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(org.hamcrest.Matchers.greaterThan(0))));
    }

    @Test
    void createsGuestAppointmentWithoutAuth() throws Exception {
        LocalDate date = LocalDate.now(ZONE).plusDays(2);
        while (date.getDayOfWeek().getValue() > 6) {
            date = date.plusDays(1);
        }
        String startAt = date.atTime(10, 0).atZone(ZONE).toOffsetDateTime().toString();

        Map<String, Object> request = Map.of(
                "servicePublicId", activeService.getPublicId().toString(),
                "professionalPublicId", professional.getPublicId().toString(),
                "startAt", startAt,
                "guestName", "Joao Visitante",
                "guestPhone", "11999998888"
        );

        mockMvc.perform(post("/public/tenants/studio-bella/appointments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.guestName").value("Joao Visitante"))
                .andExpect(jsonPath("$.guestPhone").value("11999998888"))
                .andExpect(jsonPath("$.status").value("SCHEDULED"));
    }
}
