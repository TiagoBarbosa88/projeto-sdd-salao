package br.com.salao.testsupport;

import br.com.salao.domain.entity.Role;
import br.com.salao.domain.entity.Tenant;
import br.com.salao.domain.entity.TenantUser;
import br.com.salao.domain.entity.User;
import br.com.salao.domain.repository.AppointmentRepository;
import br.com.salao.domain.repository.AuditLogRepository;
import br.com.salao.domain.repository.SalonServiceRepository;
import br.com.salao.domain.repository.TenantRepository;
import br.com.salao.domain.repository.TenantUserRepository;
import br.com.salao.domain.repository.UserRepository;
import br.com.salao.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;

public final class TestDataFactory {

    private TestDataFactory() {}

    public static void resetDatabase(
            AuditLogRepository auditLogRepository,
            AppointmentRepository appointmentRepository,
            SalonServiceRepository salonServiceRepository,
            TenantUserRepository tenantUserRepository,
            UserRepository userRepository,
            TenantRepository tenantRepository) {
        auditLogRepository.deleteAll();
        appointmentRepository.deleteAll();
        salonServiceRepository.deleteAll();
        tenantUserRepository.deleteAll();
        userRepository.deleteAll();
        tenantRepository.deleteAll();
    }

    public static Tenant createTenant(TenantRepository tenantRepository, String slug) {
        Tenant tenant = new Tenant();
        tenant.setName("Salao " + slug);
        tenant.setSlug(slug);
        return tenantRepository.save(tenant);
    }

    public static User createUser(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            String email,
            String name) {
        User user = new User();
        user.setEmail(email);
        user.setName(name);
        user.setPasswordHash(passwordEncoder.encode("senha1234"));
        return userRepository.save(user);
    }

    public static TenantUser linkUser(
            TenantUserRepository tenantUserRepository,
            Tenant tenant,
            User user,
            Role role) {
        TenantUser tenantUser = new TenantUser();
        tenantUser.setTenant(tenant);
        tenantUser.setUser(user);
        tenantUser.setRole(role);
        return tenantUserRepository.save(tenantUser);
    }

    public static String tokenFor(JwtService jwtService, User user, Tenant tenant, Role role) {
        return jwtService.generateToken(user.getPublicId(), tenant.getPublicId(), role, user.getEmail());
    }
}
