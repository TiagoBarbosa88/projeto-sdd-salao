package br.com.salao.service;

import br.com.salao.domain.entity.Appointment;
import br.com.salao.domain.entity.AppointmentStatus;
import br.com.salao.domain.entity.ProfessionalBlockedPeriod;
import br.com.salao.domain.entity.ProfessionalProfile;
import br.com.salao.domain.entity.ProfessionalWorkingPeriod;
import br.com.salao.domain.entity.SalonService;
import br.com.salao.domain.entity.Tenant;
import br.com.salao.domain.entity.TenantSchedulingSettings;
import br.com.salao.domain.entity.TenantUser;
import br.com.salao.domain.entity.User;
import br.com.salao.domain.repository.AppointmentRepository;
import br.com.salao.domain.repository.ProfessionalBlockedPeriodRepository;
import br.com.salao.domain.repository.ProfessionalProfileRepository;
import br.com.salao.domain.repository.ProfessionalWorkingPeriodRepository;
import br.com.salao.domain.repository.SalonServiceRepository;
import br.com.salao.domain.repository.TenantRepository;
import br.com.salao.domain.repository.TenantUserRepository;
import br.com.salao.web.dto.AvailabilitySlotResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class AvailabilityService {

    private final TenantRepository tenantRepository;
    private final TenantUserRepository tenantUserRepository;
    private final SalonServiceRepository salonServiceRepository;
    private final ProfessionalProfileRepository professionalProfileRepository;
    private final ProfessionalWorkingPeriodRepository workingPeriodRepository;
    private final ProfessionalBlockedPeriodRepository blockedPeriodRepository;
    private final AppointmentRepository appointmentRepository;
    private final SalonSettingsService salonSettingsService;
    private final TenantResolver tenantResolver;

    public AvailabilityService(
            TenantRepository tenantRepository,
            TenantUserRepository tenantUserRepository,
            SalonServiceRepository salonServiceRepository,
            ProfessionalProfileRepository professionalProfileRepository,
            ProfessionalWorkingPeriodRepository workingPeriodRepository,
            ProfessionalBlockedPeriodRepository blockedPeriodRepository,
            AppointmentRepository appointmentRepository,
            SalonSettingsService salonSettingsService,
            TenantResolver tenantResolver) {
        this.tenantRepository = tenantRepository;
        this.tenantUserRepository = tenantUserRepository;
        this.salonServiceRepository = salonServiceRepository;
        this.professionalProfileRepository = professionalProfileRepository;
        this.workingPeriodRepository = workingPeriodRepository;
        this.blockedPeriodRepository = blockedPeriodRepository;
        this.appointmentRepository = appointmentRepository;
        this.salonSettingsService = salonSettingsService;
        this.tenantResolver = tenantResolver;
    }

    @Transactional(readOnly = true)
    public List<AvailabilitySlotResponse> getAvailableSlots(
            UUID professionalPublicId,
            UUID servicePublicId,
            LocalDate date) {
        Tenant tenant = tenantResolver.requireCurrentTenant();
        return computeSlots(tenant, professionalPublicId, servicePublicId, date);
    }

    @Transactional(readOnly = true)
    public List<AvailabilitySlotResponse> getAvailableSlotsBySlug(
            String slug,
            UUID professionalPublicId,
            UUID servicePublicId,
            LocalDate date) {
        Tenant tenant = tenantRepository.findBySlug(slug)
                .filter(Tenant::isActive)
                .orElseThrow(ResourceNotFoundException::new);
        return computeSlots(tenant, professionalPublicId, servicePublicId, date);
    }

    @Transactional(readOnly = true)
    public void validateSlotAvailable(
            Tenant tenant,
            User professional,
            SalonService service,
            OffsetDateTime startAt) {
        TenantSchedulingSettings settings = salonSettingsService.requireSchedulingSettingsForTenant(tenant.getId());
        OffsetDateTime endAt = startAt.plusMinutes(service.getDurationMinutes());
        OffsetDateTime rangeEnd = endAt.plusMinutes(settings.getBufferMinutes());

        if (hasConflictWithBuffer(
                tenant.getId(),
                professional.getId(),
                startAt,
                rangeEnd,
                AppointmentStatus.CANCELLED)) {
            throw new SlotUnavailableException();
        }

        TenantUser tenantUser = tenantUserRepository
                .findByTenant_IdAndUser_PublicId(tenant.getId(), professional.getPublicId())
                .orElseThrow(ResourceNotFoundException::new);

        ProfessionalProfile profile = professionalProfileRepository.findByTenantUser_Id(tenantUser.getId())
                .orElseThrow(ResourceNotFoundException::new);
        if (!profile.isBookable() || !profile.isActive()) {
            throw new SlotUnavailableException();
        }

        ZoneId zone = ZoneId.of(settings.getZoneId());
        LocalDate date = startAt.atZoneSameInstant(zone).toLocalDate();
        int dayOfWeek = date.getDayOfWeek().getValue();

        List<ProfessionalWorkingPeriod> workingPeriods =
                workingPeriodRepository.findByTenantUser_IdAndDayOfWeek(tenantUser.getId(), dayOfWeek);
        if (workingPeriods.isEmpty()) {
            throw new SlotUnavailableException();
        }

        LocalTime slotStart = startAt.atZoneSameInstant(zone).toLocalTime();
        LocalTime slotEnd = endAt.atZoneSameInstant(zone).toLocalTime();
        boolean withinWorkingHours = workingPeriods.stream()
                .anyMatch(p -> !slotStart.isBefore(p.getStartTime()) && !slotEnd.isAfter(p.getEndTime()));
        if (!withinWorkingHours) {
            throw new SlotUnavailableException();
        }

        List<ProfessionalBlockedPeriod> blocks = blockedPeriodRepository.findOverlapping(
                tenantUser.getId(), startAt, rangeEnd);
        if (!blocks.isEmpty()) {
            throw new SlotUnavailableException();
        }
    }

    private List<AvailabilitySlotResponse> computeSlots(
            Tenant tenant,
            UUID professionalPublicId,
            UUID servicePublicId,
            LocalDate date) {
        SalonService service = salonServiceRepository
                .findByPublicIdAndTenantId(servicePublicId, tenant.getId())
                .filter(SalonService::isActive)
                .orElseThrow(ResourceNotFoundException::new);

        TenantUser tenantUser = tenantUserRepository
                .findByTenant_IdAndUser_PublicId(tenant.getId(), professionalPublicId)
                .orElseThrow(ResourceNotFoundException::new);

        ProfessionalProfile profile = professionalProfileRepository.findByTenantUser_Id(tenantUser.getId())
                .orElseThrow(ResourceNotFoundException::new);
        if (!profile.isBookable() || !profile.isActive()) {
            return List.of();
        }

        TenantSchedulingSettings settings = salonSettingsService.requireSchedulingSettingsForTenant(tenant.getId());
        ZoneId zone = ZoneId.of(settings.getZoneId());
        int dayOfWeek = date.getDayOfWeek().getValue();

        List<ProfessionalWorkingPeriod> workingPeriods =
                workingPeriodRepository.findByTenantUser_IdAndDayOfWeek(tenantUser.getId(), dayOfWeek);
        if (workingPeriods.isEmpty()) {
            return List.of();
        }

        OffsetDateTime dayStart = date.atTime(settings.getDayStartTime()).atZone(zone).toOffsetDateTime();
        OffsetDateTime dayEnd = date.atTime(settings.getDayEndTime()).atZone(zone).toOffsetDateTime();

        List<ProfessionalBlockedPeriod> blocks =
                blockedPeriodRepository.findOverlapping(tenantUser.getId(), dayStart, dayEnd);

        List<Appointment> appointments = appointmentRepository.findActiveByProfessionalAndRange(
                tenant.getId(),
                tenantUser.getUser().getId(),
                dayStart,
                dayEnd,
                AppointmentStatus.CANCELLED);

        int durationMinutes = service.getDurationMinutes();
        int intervalMinutes = settings.getSlotIntervalMinutes();
        int bufferMinutes = settings.getBufferMinutes();

        List<AvailabilitySlotResponse> slots = new ArrayList<>();
        OffsetDateTime cursor = dayStart;

        while (!cursor.plusMinutes(durationMinutes).isAfter(dayEnd)) {
            OffsetDateTime slotEnd = cursor.plusMinutes(durationMinutes);
            OffsetDateTime slotEndWithBuffer = slotEnd.plusMinutes(bufferMinutes);

            LocalTime slotStartTime = cursor.atZoneSameInstant(zone).toLocalTime();
            LocalTime slotEndTime = slotEnd.atZoneSameInstant(zone).toLocalTime();

            boolean withinWorking = workingPeriods.stream()
                    .anyMatch(p -> !slotStartTime.isBefore(p.getStartTime())
                            && !slotEndTime.isAfter(p.getEndTime()));

            if (withinWorking && !overlapsBlocked(cursor, slotEndWithBuffer, blocks)
                    && !overlapsAppointments(cursor, slotEndWithBuffer, appointments)) {
                slots.add(new AvailabilitySlotResponse(cursor, slotEnd));
            }

            cursor = cursor.plusMinutes(intervalMinutes);
        }

        return slots;
    }

    private boolean overlapsBlocked(
            OffsetDateTime start,
            OffsetDateTime end,
            List<ProfessionalBlockedPeriod> blocks) {
        return blocks.stream().anyMatch(b -> b.getStartAt().isBefore(end) && b.getEndAt().isAfter(start));
    }

    private boolean overlapsAppointments(
            OffsetDateTime start,
            OffsetDateTime end,
            List<Appointment> appointments) {
        return appointments.stream().anyMatch(a -> {
            OffsetDateTime blockedEnd = a.getEndAt().plusMinutes(a.getBufferMinutes());
            return a.getStartAt().isBefore(end) && blockedEnd.isAfter(start);
        });
    }

    boolean hasConflictWithBuffer(
            Long tenantId,
            Long professionalId,
            OffsetDateTime rangeStart,
            OffsetDateTime rangeEnd,
            AppointmentStatus cancelledStatus) {
        return appointmentRepository.findPotentialConflicts(
                        tenantId, professionalId, rangeStart, rangeEnd, cancelledStatus)
                .stream()
                .anyMatch(a -> a.getStartAt().isBefore(rangeEnd)
                        && a.getEndAt().plusMinutes(a.getBufferMinutes()).isAfter(rangeStart));
    }
}
