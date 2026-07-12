package br.com.salao.web;

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
import br.com.salao.testsupport.TestDataFactory;
import br.com.salao.testsupport.TestRepositories;
import com.fasterxml.jackson.databind.JsonNode;
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
import java.util.Map;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ServiceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

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

        Tenant tenant = TestDataFactory.createTenant(tenantRepository, "svc-salon");
        User admin = TestDataFactory.createUser(userRepository, passwordEncoder, "admin@svc.com", "Admin");
        TestDataFactory.linkUser(tenantUserRepository, tenant, admin, Role.ADMIN);
        adminToken = TestDataFactory.tokenFor(jwtService, admin, tenant, Role.ADMIN);
    }

    @Test
    void adminCanCreateAndListServices() throws Exception {
        Map<String, Object> request = Map.of(
                "name", "Corte Masculino",
                "description", "Corte classico",
                "durationMinutes", 30,
                "price", 45.00
        );

        mockMvc.perform(post("/services")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.publicId").isNotEmpty())
                .andExpect(jsonPath("$.name").value("Corte Masculino"))
                .andExpect(jsonPath("$.price").value(45.00))
                .andExpect(jsonPath("$.active").value(true))
                .andExpect(jsonPath("$.id").doesNotExist());

        mockMvc.perform(get("/services")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));
    }

    @Test
    void adminCanUpdateAndSoftDeleteService() throws Exception {
        String publicId = createService();

        Map<String, Object> update = Map.of(
                "name", "Corte Premium",
                "description", "Atualizado",
                "durationMinutes", 45,
                "price", 60.00,
                "active", true
        );

        mockMvc.perform(put("/services/" + publicId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Corte Premium"));

        mockMvc.perform(delete("/services/" + publicId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/services/" + publicId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active").value(false));
    }

    @Test
    void nonAdminCannotCreateService() throws Exception {
        Tenant tenant = tenantRepository.findBySlug("svc-salon").orElseThrow();
        User client = TestDataFactory.createUser(userRepository, passwordEncoder, "client@svc.com", "Cliente");
        TestDataFactory.linkUser(tenantUserRepository, tenant, client, Role.CLIENT);
        String clientToken = TestDataFactory.tokenFor(jwtService, client, tenant, Role.CLIENT);

        Map<String, Object> request = Map.of(
                "name", "Barba",
                "durationMinutes", 20,
                "price", 25.00
        );

        mockMvc.perform(post("/services")
                        .header("Authorization", "Bearer " + clientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    private String createService() throws Exception {
        Map<String, Object> request = Map.of(
                "name", "Corte",
                "durationMinutes", 30,
                "price", 40.00
        );

        String response = mockMvc.perform(post("/services")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode body = objectMapper.readTree(response);
        return body.get("publicId").asText();
    }
}
