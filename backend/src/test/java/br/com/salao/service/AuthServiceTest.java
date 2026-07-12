package br.com.salao.service;

import br.com.salao.domain.entity.Role;
import br.com.salao.domain.repository.AppointmentRepository;
import br.com.salao.domain.repository.AuditLogRepository;
import br.com.salao.domain.repository.SalonServiceRepository;
import br.com.salao.domain.repository.TenantRepository;
import br.com.salao.domain.repository.TenantUserRepository;
import br.com.salao.domain.repository.UserRepository;
import br.com.salao.security.JwtService;
import br.com.salao.testsupport.TestDataFactory;
import br.com.salao.testsupport.TestRepositories;
import br.com.salao.web.dto.AuthResponse;
import br.com.salao.web.dto.LoginRequest;
import br.com.salao.web.dto.RegisterRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
class AuthServiceTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private JwtService jwtService;

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

    @Autowired
    private TestRepositories testRepositories;

    @BeforeEach
    void cleanDatabase() {
        TestDataFactory.resetDatabase(
                testRepositories,
                auditLogRepository,
                appointmentRepository,
                salonServiceRepository,
                tenantUserRepository,
                userRepository,
                tenantRepository);
    }

    @Test
    void registerCreatesTenantAdminAndTenantUser() {
        RegisterRequest request = new RegisterRequest(
                "Barbearia Central",
                "barbearia-central",
                "Joao Admin",
                "joao@barbearia.com",
                "senha1234"
        );

        AuthResponse response = authService.register(request);

        assertThat(response.token()).isNotBlank();
        assertThat(response.role()).isEqualTo(Role.ADMIN);
        assertThat(response.user().email()).isEqualTo("joao@barbearia.com");
        assertThat(response.tenant().slug()).isEqualTo("barbearia-central");

        assertThat(tenantRepository.findBySlug("barbearia-central")).isPresent();
        assertThat(userRepository.findByEmail("joao@barbearia.com")).isPresent();
        assertThat(tenantUserRepository.findAll()).hasSize(1);

        JwtService.JwtClaims claims = jwtService.parseToken(response.token());
        assertThat(claims.userPublicId()).isEqualTo(response.user().publicId());
        assertThat(claims.tenantPublicId()).isEqualTo(response.tenant().publicId());
        assertThat(claims.role()).isEqualTo(Role.ADMIN);
    }

    @Test
    void registerRejectsDuplicateEmail() {
        RegisterRequest request = new RegisterRequest(
                "Salao A",
                "salao-a",
                "Usuario A",
                "dup@email.com",
                "senha1234"
        );
        authService.register(request);

        RegisterRequest duplicate = new RegisterRequest(
                "Salao B",
                "salao-b",
                "Usuario B",
                "dup@email.com",
                "senha1234"
        );

        assertThatThrownBy(() -> authService.register(duplicate))
                .isInstanceOf(EmailAlreadyExistsException.class);
    }

    @Test
    void loginReturnsValidJwtForRegisteredUser() {
        authService.register(new RegisterRequest(
                "Salao Login",
                "salao-login",
                "Ana Admin",
                "ana@salao.com",
                "senha1234"
        ));

        AuthResponse response = authService.login(new LoginRequest("ana@salao.com", "senha1234"));

        assertThat(response.token()).isNotBlank();
        assertThat(response.user().publicId()).isNotNull();
        assertThat(response.tenant().publicId()).isNotNull();
        assertThat(jwtService.parseToken(response.token()).email()).isEqualTo("ana@salao.com");
    }

    @Test
    void loginRejectsInvalidPassword() {
        authService.register(new RegisterRequest(
                "Salao Seguro",
                "salao-seguro",
                "Carlos Admin",
                "carlos@salao.com",
                "senha1234"
        ));

        assertThatThrownBy(() -> authService.login(new LoginRequest("carlos@salao.com", "errada123")))
                .isInstanceOf(InvalidCredentialsException.class);
    }
}
