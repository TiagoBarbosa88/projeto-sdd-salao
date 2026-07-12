package br.com.salao.web;

import br.com.salao.domain.entity.Role;
import br.com.salao.domain.entity.Tenant;
import br.com.salao.domain.entity.User;
import br.com.salao.domain.repository.AppointmentRepository;
import br.com.salao.domain.repository.SalonServiceRepository;
import br.com.salao.domain.repository.TenantRepository;
import br.com.salao.domain.repository.TenantUserRepository;
import br.com.salao.domain.repository.UserRepository;
import br.com.salao.security.JwtService;
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
class TeamControllerTest {

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
    private JwtService jwtService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private Tenant tenant;
    private User admin;
    private User professional;
    private User client;
    private String adminToken;

    @BeforeEach
    void setUp() {
        appointmentRepository.deleteAll();
        salonServiceRepository.deleteAll();
        tenantUserRepository.deleteAll();
        userRepository.deleteAll();
        tenantRepository.deleteAll();

        tenant = TestDataFactory.createTenant(tenantRepository, "team-salon");
        admin = TestDataFactory.createUser(userRepository, passwordEncoder, "admin@team.com", "Admin");
        professional = TestDataFactory.createUser(userRepository, passwordEncoder, "pro@team.com", "Marina");
        client = TestDataFactory.createUser(userRepository, passwordEncoder, "client@team.com", "Cliente");

        TestDataFactory.linkUser(tenantUserRepository, tenant, admin, Role.ADMIN);
        TestDataFactory.linkUser(tenantUserRepository, tenant, professional, Role.PROFESSIONAL);
        TestDataFactory.linkUser(tenantUserRepository, tenant, client, Role.CLIENT);

        adminToken = TestDataFactory.tokenFor(jwtService, admin, tenant, Role.ADMIN);
    }

    @Test
    void listsAllTenantMembers() throws Exception {
        mockMvc.perform(get("/team/members")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(3)))
                .andExpect(jsonPath("$[0].name").exists())
                .andExpect(jsonPath("$[0].publicId").exists())
                .andExpect(jsonPath("$[0].role").exists());
    }

    @Test
    void filtersMembersByProfessionalRole() throws Exception {
        mockMvc.perform(get("/team/members")
                        .param("role", "PROFESSIONAL")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].name").value("Marina"))
                .andExpect(jsonPath("$[0].role").value("PROFESSIONAL"));
    }

    @Test
    void filtersMembersByClientRole() throws Exception {
        mockMvc.perform(get("/team/members")
                        .param("role", "CLIENT")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].name").value("Cliente"))
                .andExpect(jsonPath("$[0].role").value("CLIENT"));
    }
}
