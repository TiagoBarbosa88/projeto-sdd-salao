package br.com.salao.web;

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
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Map;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AppointmentControllerTest {

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
    private JwtService jwtService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private Tenant tenant;
    private User admin;
    private User professional;
    private User client;
    private SalonService service;
    private String adminToken;

    @BeforeEach
    void setUp() {
        TestDataFactory.resetDatabase(
                auditLogRepository,
                appointmentRepository,
                salonServiceRepository,
                tenantUserRepository,
                userRepository,
                tenantRepository);

        tenant = TestDataFactory.createTenant(tenantRepository, "appt-salon");
        admin = TestDataFactory.createUser(userRepository, passwordEncoder, "admin@appt.com", "Admin");
        professional = TestDataFactory.createUser(userRepository, passwordEncoder, "pro@appt.com", "Pro");
        client = TestDataFactory.createUser(userRepository, passwordEncoder, "client@appt.com", "Cliente");

        TestDataFactory.linkUser(tenantUserRepository, tenant, admin, Role.ADMIN);
        TestDataFactory.linkUser(tenantUserRepository, tenant, professional, Role.PROFESSIONAL);
        TestDataFactory.linkUser(tenantUserRepository, tenant, client, Role.CLIENT);

        service = new SalonService();
        service.setTenantId(tenant.getId());
        service.setName("Corte");
        service.setDurationMinutes(60);
        service.setPrice(new BigDecimal("50.00"));
        service.setActive(true);
        service = salonServiceRepository.save(service);

        adminToken = TestDataFactory.tokenFor(jwtService, admin, tenant, Role.ADMIN);
    }

    @Test
    void adminCanCreateAppointment() throws Exception {
        OffsetDateTime startAt = OffsetDateTime.now(ZoneOffset.UTC).plusDays(1).withHour(10).withMinute(0).withSecond(0).withNano(0);

        Map<String, Object> request = Map.of(
                "servicePublicId", service.getPublicId().toString(),
                "professionalPublicId", professional.getPublicId().toString(),
                "clientPublicId", client.getPublicId().toString(),
                "startAt", startAt.toString()
        );

        mockMvc.perform(post("/appointments")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.publicId").isNotEmpty())
                .andExpect(jsonPath("$.status").value("SCHEDULED"))
                .andExpect(jsonPath("$.service.publicId").value(service.getPublicId().toString()))
                .andExpect(jsonPath("$.service.name").value("Corte"))
                .andExpect(jsonPath("$.professional.name").value("Pro"))
                .andExpect(jsonPath("$.client.name").value("Cliente"))
                .andExpect(jsonPath("$.id").doesNotExist());
    }

    @Test
    void listAppointmentsReturnsNamedRefs() throws Exception {
        OffsetDateTime startAt = OffsetDateTime.now(ZoneOffset.UTC).plusDays(1).withHour(10).withMinute(0).withSecond(0).withNano(0);

        Map<String, Object> request = Map.of(
                "servicePublicId", service.getPublicId().toString(),
                "professionalPublicId", professional.getPublicId().toString(),
                "clientPublicId", client.getPublicId().toString(),
                "startAt", startAt.toString()
        );

        mockMvc.perform(post("/appointments")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/appointments")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].service.name").value("Corte"))
                .andExpect(jsonPath("$[0].professional.name").value("Pro"))
                .andExpect(jsonPath("$[0].client.name").value("Cliente"));
    }

    @Test
    void overlappingAppointmentReturnsConflict() throws Exception {
        OffsetDateTime startAt = OffsetDateTime.now(ZoneOffset.UTC).plusDays(1).withHour(14).withMinute(0).withSecond(0).withNano(0);

        Map<String, Object> request = Map.of(
                "servicePublicId", service.getPublicId().toString(),
                "professionalPublicId", professional.getPublicId().toString(),
                "clientPublicId", client.getPublicId().toString(),
                "startAt", startAt.toString()
        );

        mockMvc.perform(post("/appointments")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/appointments")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("APPOINTMENT_CONFLICT"));
    }

    @Test
    void inactiveServiceCannotBeScheduled() throws Exception {
        service.setActive(false);
        salonServiceRepository.save(service);

        OffsetDateTime startAt = OffsetDateTime.now(ZoneOffset.UTC).plusDays(2).withHour(9).withMinute(0).withSecond(0).withNano(0);

        Map<String, Object> request = Map.of(
                "servicePublicId", service.getPublicId().toString(),
                "professionalPublicId", professional.getPublicId().toString(),
                "clientPublicId", client.getPublicId().toString(),
                "startAt", startAt.toString()
        );

        mockMvc.perform(post("/appointments")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INACTIVE_SERVICE"));
    }
}
