package br.com.salao.security;

import br.com.salao.domain.entity.Role;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
class JwtServiceTest {

    @Autowired
    private JwtService jwtService;

    @Test
    void generatesAndParsesToken() {
        UUID userPublicId = UUID.randomUUID();
        UUID tenantPublicId = UUID.randomUUID();

        String token = jwtService.generateToken(userPublicId, tenantPublicId, Role.ADMIN, "user@test.com");
        JwtService.JwtClaims claims = jwtService.parseToken(token);

        assertThat(claims.userPublicId()).isEqualTo(userPublicId);
        assertThat(claims.tenantPublicId()).isEqualTo(tenantPublicId);
        assertThat(claims.role()).isEqualTo(Role.ADMIN);
        assertThat(claims.email()).isEqualTo("user@test.com");
    }

    @Test
    void rejectsTamperedToken() {
        String token = jwtService.generateToken(UUID.randomUUID(), UUID.randomUUID(), Role.CLIENT, "user@test.com");
        String tampered = token.substring(0, token.length() - 4) + "xxxx";

        assertThatThrownBy(() -> jwtService.parseToken(tampered))
                .isInstanceOf(InvalidJwtException.class);
    }
}
