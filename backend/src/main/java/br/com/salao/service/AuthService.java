package br.com.salao.service;

import br.com.salao.domain.entity.AuditAction;
import br.com.salao.domain.entity.Role;
import br.com.salao.domain.entity.Tenant;
import br.com.salao.domain.entity.TenantUser;
import br.com.salao.domain.entity.User;
import br.com.salao.domain.repository.TenantRepository;
import br.com.salao.domain.repository.TenantUserRepository;
import br.com.salao.domain.repository.UserRepository;
import br.com.salao.security.AuthenticatedUser;
import br.com.salao.security.JwtService;
import br.com.salao.web.dto.AuthResponse;
import br.com.salao.web.dto.LoginRequest;
import br.com.salao.web.dto.MeResponse;
import br.com.salao.web.dto.RegisterRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final TenantUserRepository tenantUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuditService auditService;

    public AuthService(
            TenantRepository tenantRepository,
            UserRepository userRepository,
            TenantUserRepository tenantUserRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuditService auditService) {
        this.tenantRepository = tenantRepository;
        this.userRepository = userRepository;
        this.tenantUserRepository = tenantUserRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.auditService = auditService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new EmailAlreadyExistsException();
        }
        if (tenantRepository.existsBySlug(request.slug())) {
            throw new SlugAlreadyExistsException();
        }

        Tenant tenant = new Tenant();
        tenant.setName(request.salonName());
        tenant.setSlug(request.slug());
        tenant = tenantRepository.save(tenant);

        User user = new User();
        user.setEmail(request.email());
        user.setName(request.name());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user = userRepository.save(user);

        TenantUser tenantUser = new TenantUser();
        tenantUser.setTenant(tenant);
        tenantUser.setUser(user);
        tenantUser.setRole(Role.ADMIN);
        tenantUserRepository.save(tenantUser);

        return buildAuthResponse(user, tenant, Role.ADMIN);
    }

    @Transactional(readOnly = true)
    public MeResponse getMe() {
        AuthenticatedUser principal = getAuthenticatedUser();
        User user = userRepository.findByPublicId(principal.getUserPublicId())
                .orElseThrow(InvalidCredentialsException::new);
        Tenant tenant = tenantRepository.findByPublicId(principal.getTenantPublicId())
                .orElseThrow(InvalidCredentialsException::new);

        return new MeResponse(
                new AuthResponse.UserSummary(user.getPublicId(), user.getEmail(), user.getName()),
                new AuthResponse.TenantSummary(tenant.getPublicId(), tenant.getName(), tenant.getSlug()),
                principal.getRole()
        );
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(InvalidCredentialsException::new);

        if (!user.isActive() || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new InvalidCredentialsException();
        }

        TenantUser tenantUser = tenantUserRepository.findAllByUserIdWithTenant(user.getId()).stream()
                .findFirst()
                .orElseThrow(InvalidCredentialsException::new);

        auditService.record(
                tenantUser.getTenant().getId(),
                user.getId(),
                AuditAction.LOGIN,
                "User",
                user.getPublicId(),
                null);

        return buildAuthResponse(user, tenantUser.getTenant(), tenantUser.getRole());
    }

    private AuthenticatedUser getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthenticatedUser authenticatedUser)) {
            throw new InvalidCredentialsException();
        }
        return authenticatedUser;
    }

    private AuthResponse buildAuthResponse(User user, Tenant tenant, Role role) {
        String token = jwtService.generateToken(user.getPublicId(), tenant.getPublicId(), role, user.getEmail());
        return new AuthResponse(
                token,
                new AuthResponse.UserSummary(user.getPublicId(), user.getEmail(), user.getName()),
                new AuthResponse.TenantSummary(tenant.getPublicId(), tenant.getName(), tenant.getSlug()),
                role
        );
    }
}
