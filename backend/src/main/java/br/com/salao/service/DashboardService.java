package br.com.salao.service;

import br.com.salao.domain.entity.Appointment;
import br.com.salao.domain.entity.AppointmentStatus;
import br.com.salao.domain.entity.Role;
import br.com.salao.domain.entity.Tenant;
import br.com.salao.domain.repository.AppointmentRepository;
import br.com.salao.domain.repository.TenantUserRepository;
import br.com.salao.web.dto.DashboardSummaryResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

@Service
public class DashboardService {

    private static final int WORKDAY_MINUTES = 8 * 60;

    private final AppointmentRepository appointmentRepository;
    private final TenantUserRepository tenantUserRepository;
    private final TenantResolver tenantResolver;

    public DashboardService(
            AppointmentRepository appointmentRepository,
            TenantUserRepository tenantUserRepository,
            TenantResolver tenantResolver) {
        this.appointmentRepository = appointmentRepository;
        this.tenantUserRepository = tenantUserRepository;
        this.tenantResolver = tenantResolver;
    }

    @Transactional(readOnly = true)
    public DashboardSummaryResponse getSummary() {
        Tenant tenant = tenantResolver.requireCurrentTenant();
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        OffsetDateTime dayStart = today.atStartOfDay().atOffset(ZoneOffset.UTC);
        OffsetDateTime dayEnd = today.plusDays(1).atStartOfDay().atOffset(ZoneOffset.UTC);

        var appointments = appointmentRepository.findActiveByTenantIdAndDay(
                tenant.getId(),
                dayStart,
                dayEnd,
                AppointmentStatus.CANCELLED);

        long appointmentsToday = appointments.size();
        BigDecimal estimatedRevenue = appointments.stream()
                .map(a -> a.getService().getPrice())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long bookedMinutes = appointments.stream()
                .mapToLong(this::durationMinutes)
                .sum();

        long professionalCount = tenantUserRepository.countByTenant_IdAndRole(tenant.getId(), Role.PROFESSIONAL);
        if (professionalCount == 0) {
            professionalCount = 1;
        }

        long capacityMinutes = WORKDAY_MINUTES * professionalCount;
        double occupancyRate = capacityMinutes == 0
                ? 0.0
                : Math.min(1.0, (double) bookedMinutes / capacityMinutes);

        return new DashboardSummaryResponse(appointmentsToday, estimatedRevenue, occupancyRate);
    }

    private long durationMinutes(Appointment appointment) {
        return java.time.Duration.between(appointment.getStartAt(), appointment.getEndAt()).toMinutes();
    }
}
