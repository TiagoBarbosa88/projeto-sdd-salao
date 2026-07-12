package br.com.salao.service;

import br.com.salao.domain.entity.ProfessionalBlockedPeriod;
import br.com.salao.domain.entity.ProfessionalWorkingPeriod;
import br.com.salao.domain.entity.Role;
import br.com.salao.domain.entity.Tenant;
import br.com.salao.domain.entity.TenantUser;
import br.com.salao.domain.repository.ProfessionalBlockedPeriodRepository;
import br.com.salao.domain.repository.ProfessionalWorkingPeriodRepository;
import br.com.salao.domain.repository.TenantUserRepository;
import br.com.salao.web.dto.BlockedPeriodResponse;
import br.com.salao.web.dto.CreateBlockedPeriodRequest;
import br.com.salao.web.dto.UpdateWorkingHoursRequest;
import br.com.salao.web.dto.WorkingPeriodEntry;
import br.com.salao.web.dto.WorkingPeriodResponse;
import br.com.salao.security.AuthenticatedUser;
import br.com.salao.security.RoleAccess;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
public class ScheduleService {

    private final TenantUserRepository tenantUserRepository;
    private final ProfessionalWorkingPeriodRepository workingPeriodRepository;
    private final ProfessionalBlockedPeriodRepository blockedPeriodRepository;
    private final TenantResolver tenantResolver;

    public ScheduleService(
            TenantUserRepository tenantUserRepository,
            ProfessionalWorkingPeriodRepository workingPeriodRepository,
            ProfessionalBlockedPeriodRepository blockedPeriodRepository,
            TenantResolver tenantResolver) {
        this.tenantUserRepository = tenantUserRepository;
        this.workingPeriodRepository = workingPeriodRepository;
        this.blockedPeriodRepository = blockedPeriodRepository;
        this.tenantResolver = tenantResolver;
    }

    @Transactional(readOnly = true)
    public List<WorkingPeriodResponse> getWorkingHours(UUID userPublicId) {
        TenantUser tenantUser = resolveTenantUser(userPublicId);
        return workingPeriodRepository.findByTenantUser_IdOrderByDayOfWeekAscStartTimeAsc(tenantUser.getId()).stream()
                .map(this::toWorkingPeriodResponse)
                .toList();
    }

    @Transactional
    public List<WorkingPeriodResponse> updateWorkingHours(UUID userPublicId, UpdateWorkingHoursRequest request) {
        requireScheduleWriteAccess(userPublicId);
        TenantUser tenantUser = resolveTenantUser(userPublicId);
        validateWorkingPeriods(request.periods());

        workingPeriodRepository.deleteByTenantUser_Id(tenantUser.getId());

        List<ProfessionalWorkingPeriod> saved = new ArrayList<>();
        for (WorkingPeriodEntry entry : request.periods()) {
            ProfessionalWorkingPeriod period = new ProfessionalWorkingPeriod();
            period.setTenantUser(tenantUser);
            period.setDayOfWeek(entry.dayOfWeek());
            period.setStartTime(entry.startTime());
            period.setEndTime(entry.endTime());
            saved.add(workingPeriodRepository.save(period));
        }

        return saved.stream()
                .sorted(Comparator.comparingInt(ProfessionalWorkingPeriod::getDayOfWeek)
                        .thenComparing(ProfessionalWorkingPeriod::getStartTime))
                .map(this::toWorkingPeriodResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<BlockedPeriodResponse> listBlockedPeriods(UUID userPublicId) {
        TenantUser tenantUser = resolveTenantUser(userPublicId);
        return blockedPeriodRepository.findByTenantUser_IdOrderByStartAtAsc(tenantUser.getId()).stream()
                .map(this::toBlockedPeriodResponse)
                .toList();
    }

    @Transactional
    public BlockedPeriodResponse createBlockedPeriod(UUID userPublicId, CreateBlockedPeriodRequest request) {
        requireScheduleWriteAccess(userPublicId);
        if (request.startAt() == null || request.endAt() == null || !request.startAt().isBefore(request.endAt())) {
            throw new InvalidScheduleException();
        }

        TenantUser tenantUser = resolveTenantUser(userPublicId);
        ProfessionalBlockedPeriod blocked = new ProfessionalBlockedPeriod();
        blocked.setTenantUser(tenantUser);
        blocked.setStartAt(request.startAt());
        blocked.setEndAt(request.endAt());
        blocked.setReason(request.reason());
        blocked.setBlockType(request.blockType() != null ? request.blockType() : blocked.getBlockType());
        return toBlockedPeriodResponse(blockedPeriodRepository.save(blocked));
    }

    @Transactional
    public void deleteBlockedPeriod(UUID userPublicId, UUID blockPublicId) {
        requireScheduleWriteAccess(userPublicId);
        TenantUser tenantUser = resolveTenantUser(userPublicId);
        ProfessionalBlockedPeriod blocked = blockedPeriodRepository
                .findByPublicIdAndTenantUser_Id(blockPublicId, tenantUser.getId())
                .orElseThrow(ResourceNotFoundException::new);
        blockedPeriodRepository.delete(blocked);
    }

    TenantUser resolveTenantUser(UUID userPublicId) {
        Tenant tenant = tenantResolver.requireCurrentTenant();
        return tenantUserRepository.findByTenant_IdAndUser_PublicId(tenant.getId(), userPublicId)
                .orElseThrow(ResourceNotFoundException::new);
    }

    private void requireScheduleWriteAccess(UUID userPublicId) {
        AuthenticatedUser principal = getAuthenticatedUser();
        Role role = principal.getRole();
        if (RoleAccess.canManageAllSchedules(role)) {
            resolveTenantUser(userPublicId);
            return;
        }
        if (RoleAccess.isStaffReader(role) && principal.getUserPublicId().equals(userPublicId)) {
            return;
        }
        throw new AccessDeniedException();
    }

    private AuthenticatedUser getAuthenticatedUser() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthenticatedUser authenticatedUser)) {
            throw new AccessDeniedException();
        }
        return authenticatedUser;
    }

    private void validateWorkingPeriods(List<WorkingPeriodEntry> periods) {
        if (periods == null) {
            throw new InvalidScheduleException();
        }
        for (WorkingPeriodEntry entry : periods) {
            if (entry.dayOfWeek() < 1 || entry.dayOfWeek() > 7) {
                throw new InvalidScheduleException();
            }
            if (entry.startTime() == null || entry.endTime() == null || !entry.startTime().isBefore(entry.endTime())) {
                throw new InvalidScheduleException();
            }
        }
    }

    private WorkingPeriodResponse toWorkingPeriodResponse(ProfessionalWorkingPeriod period) {
        return new WorkingPeriodResponse(
                period.getPublicId(),
                period.getDayOfWeek(),
                period.getStartTime(),
                period.getEndTime()
        );
    }

    private BlockedPeriodResponse toBlockedPeriodResponse(ProfessionalBlockedPeriod blocked) {
        return new BlockedPeriodResponse(
                blocked.getPublicId(),
                blocked.getStartAt(),
                blocked.getEndAt(),
                blocked.getReason(),
                blocked.getBlockType()
        );
    }
}
