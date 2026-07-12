package br.com.salao.testsupport;

import br.com.salao.domain.entity.ProfessionalProfile;
import br.com.salao.domain.entity.ProfessionalWorkingPeriod;
import br.com.salao.domain.entity.Role;
import br.com.salao.domain.entity.Tenant;
import br.com.salao.domain.entity.TenantSchedulingSettings;
import br.com.salao.domain.entity.TenantUser;
import br.com.salao.domain.entity.User;
import br.com.salao.domain.repository.AppointmentRepository;
import br.com.salao.domain.repository.AuditLogRepository;
import br.com.salao.domain.repository.ProfessionalBlockedPeriodRepository;
import br.com.salao.domain.repository.ProfessionalProfileRepository;
import br.com.salao.domain.repository.ProfessionalWorkingPeriodRepository;
import br.com.salao.domain.repository.SalonServiceRepository;
import br.com.salao.domain.repository.TenantRepository;
import br.com.salao.domain.repository.TenantSchedulingSettingsRepository;
import br.com.salao.domain.repository.TenantUserRepository;
import br.com.salao.domain.repository.UserRepository;
import br.com.salao.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalTime;

public final class TestDataFactory {

    private static final LocalTime DEFAULT_START = LocalTime.of(9, 0);
    private static final LocalTime DEFAULT_END = LocalTime.of(22, 0);

    private TestDataFactory() {}

    public static void resetDatabase(
            AuditLogRepository auditLogRepository,
            ProfessionalBlockedPeriodRepository blockedPeriodRepository,
            ProfessionalWorkingPeriodRepository workingPeriodRepository,
            ProfessionalProfileRepository professionalProfileRepository,
            TenantSchedulingSettingsRepository schedulingSettingsRepository,
            AppointmentRepository appointmentRepository,
            SalonServiceRepository salonServiceRepository,
            TenantUserRepository tenantUserRepository,
            UserRepository userRepository,
            TenantRepository tenantRepository) {
        auditLogRepository.deleteAll();
        appointmentRepository.deleteAll();
        blockedPeriodRepository.deleteAll();
        workingPeriodRepository.deleteAll();
        professionalProfileRepository.deleteAll();
        schedulingSettingsRepository.deleteAll();
        salonServiceRepository.deleteAll();
        tenantUserRepository.deleteAll();
        userRepository.deleteAll();
        tenantRepository.deleteAll();
    }

    public static void resetDatabase(
            TestRepositories repos,
            AuditLogRepository auditLogRepository,
            AppointmentRepository appointmentRepository,
            SalonServiceRepository salonServiceRepository,
            TenantUserRepository tenantUserRepository,
            UserRepository userRepository,
            TenantRepository tenantRepository) {
        resetDatabase(
                auditLogRepository,
                repos.blockedPeriodRepository(),
                repos.workingPeriodRepository(),
                repos.professionalProfileRepository(),
                repos.schedulingSettingsRepository(),
                appointmentRepository,
                salonServiceRepository,
                tenantUserRepository,
                userRepository,
                tenantRepository);
    }

    public static Tenant createTenant(TenantRepository tenantRepository, String slug) {
        Tenant tenant = new Tenant();
        tenant.setName("Salao " + slug);
        tenant.setSlug(slug);
        return tenantRepository.save(tenant);
    }

    public static TenantSchedulingSettings createSchedulingSettings(
            TenantSchedulingSettingsRepository repository,
            Tenant tenant) {
        TenantSchedulingSettings settings = new TenantSchedulingSettings();
        settings.setTenant(tenant);
        return repository.save(settings);
    }

    public static ProfessionalProfile createProfessionalProfile(
            ProfessionalProfileRepository repository,
            TenantUser tenantUser,
            boolean bookable) {
        ProfessionalProfile profile = new ProfessionalProfile();
        profile.setTenantUser(tenantUser);
        profile.setBookable(bookable);
        profile.setActive(true);
        return repository.save(profile);
    }

    public static void createDefaultWorkingPeriods(
            ProfessionalWorkingPeriodRepository repository,
            TenantUser tenantUser) {
        for (int day = 1; day <= 6; day++) {
            ProfessionalWorkingPeriod period = new ProfessionalWorkingPeriod();
            period.setTenantUser(tenantUser);
            period.setDayOfWeek(day);
            period.setStartTime(DEFAULT_START);
            period.setEndTime(DEFAULT_END);
            repository.save(period);
        }
    }

    public static void seedSchedulingForTenant(
            TenantSchedulingSettingsRepository schedulingSettingsRepository,
            ProfessionalProfileRepository professionalProfileRepository,
            ProfessionalWorkingPeriodRepository workingPeriodRepository,
            Tenant tenant,
            TenantUser professionalTenantUser) {
        createSchedulingSettings(schedulingSettingsRepository, tenant);
        createProfessionalProfile(professionalProfileRepository, professionalTenantUser, true);
        createDefaultWorkingPeriods(workingPeriodRepository, professionalTenantUser);
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
