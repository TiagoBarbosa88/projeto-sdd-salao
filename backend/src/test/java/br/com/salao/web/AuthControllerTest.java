package br.com.salao.web;

import br.com.salao.domain.entity.Role;
import br.com.salao.domain.repository.AppointmentRepository;
import br.com.salao.domain.repository.AuditLogRepository;
import br.com.salao.domain.repository.SalonServiceRepository;
import br.com.salao.domain.repository.TenantRepository;
import br.com.salao.domain.repository.TenantUserRepository;
import br.com.salao.domain.repository.UserRepository;
import br.com.salao.testsupport.TestDataFactory;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private SalonServiceRepository salonServiceRepository;

    @Autowired
    private TenantRepository tenantRepository;

    @Autowired
    private TenantUserRepository tenantUserRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @BeforeEach
    void cleanDatabase() {
        TestDataFactory.resetDatabase(
                auditLogRepository,
                appointmentRepository,
                salonServiceRepository,
                tenantUserRepository,
                userRepository,
                tenantRepository);
    }

    @Test
    void registerCreatesSalonAndAdmin() throws Exception {
        Map<String, String> request = Map.of(
                "salonName", "Studio Bella",
                "slug", "studio-bella",
                "name", "Maria Admin",
                "email", "admin@studio.com",
                "password", "senha1234"
        );

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.user.publicId").isNotEmpty())
                .andExpect(jsonPath("$.user.email").value("admin@studio.com"))
                .andExpect(jsonPath("$.tenant.publicId").isNotEmpty())
                .andExpect(jsonPath("$.tenant.slug").value("studio-bella"))
                .andExpect(jsonPath("$.role").value("ADMIN"))
                .andExpect(jsonPath("$.user.id").doesNotExist())
                .andExpect(jsonPath("$.tenant.id").doesNotExist());

        assertThat(tenantRepository.findBySlug("studio-bella")).isPresent();
        assertThat(userRepository.findByEmail("admin@studio.com")).isPresent();
        assertThat(tenantUserRepository.findAll()).hasSize(1);
    }

    @Test
    void loginReturnsJwt() throws Exception {
        registerUser("login@studio.com", "login-salon");

        Map<String, String> loginRequest = Map.of(
                "email", "login@studio.com",
                "password", "senha1234"
        );

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token", notNullValue()))
                .andExpect(jsonPath("$.user.email").value("login@studio.com"))
                .andExpect(jsonPath("$.role").value("ADMIN"));
    }

    @Test
    void loginWithInvalidCredentialsReturnsUnauthorized() throws Exception {
        registerUser("wrong@studio.com", "wrong-salon");

        Map<String, String> loginRequest = Map.of(
                "email", "wrong@studio.com",
                "password", "senha-errada"
        );

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"));
    }

    @Test
    void meWithoutTokenReturnsForbidden() throws Exception {
        mockMvc.perform(get("/auth/me"))
                .andExpect(status().isForbidden());
    }

    @Test
    void meWithValidTokenReturnsCurrentUserAndTenant() throws Exception {
        registerUser("me@studio.com", "me-salon");

        String token = loginAndGetToken("me@studio.com");

        mockMvc.perform(get("/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.publicId").isNotEmpty())
                .andExpect(jsonPath("$.user.email").value("me@studio.com"))
                .andExpect(jsonPath("$.user.name").value("Usuario Teste"))
                .andExpect(jsonPath("$.tenant.publicId").isNotEmpty())
                .andExpect(jsonPath("$.tenant.slug").value("me-salon"))
                .andExpect(jsonPath("$.role").value("ADMIN"))
                .andExpect(jsonPath("$.user.id").doesNotExist())
                .andExpect(jsonPath("$.tenant.id").doesNotExist())
                .andExpect(jsonPath("$.token").doesNotExist());
    }

    @Test
    void protectedEndpointRequiresBearerToken() throws Exception {
        mockMvc.perform(get("/protected-placeholder"))
                .andExpect(status().isForbidden());
    }

    @Test
    void healthRemainsPublic() throws Exception {
        mockMvc.perform(get("/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    private void registerUser(String email, String slug) throws Exception {
        Map<String, String> request = Map.of(
                "salonName", "Salao Teste",
                "slug", slug,
                "name", "Usuario Teste",
                "email", email,
                "password", "senha1234"
        );

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
    }

    private String loginAndGetToken(String email) throws Exception {
        Map<String, String> loginRequest = Map.of(
                "email", email,
                "password", "senha1234"
        );

        String response = mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode body = objectMapper.readTree(response);
        return body.get("token").asText();
    }
}
