package br.com.salao.service;

import br.com.salao.domain.entity.AuditAction;
import br.com.salao.domain.entity.AuditLog;
import br.com.salao.domain.entity.Tenant;
import br.com.salao.domain.entity.User;
import br.com.salao.domain.repository.AuditLogRepository;
import br.com.salao.domain.repository.UserRepository;
import br.com.salao.security.AuthenticatedUser;
import br.com.salao.web.dto.AuditLogResponse;
import br.com.salao.web.dto.NamedRef;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class AuditService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;
    private final TenantResolver tenantResolver;

    public AuditService(
            AuditLogRepository auditLogRepository,
            UserRepository userRepository,
            TenantResolver tenantResolver) {
        this.auditLogRepository = auditLogRepository;
        this.userRepository = userRepository;
        this.tenantResolver = tenantResolver;
    }

    @Transactional
    public void record(
            Long tenantId,
            Long actorUserId,
            AuditAction action,
            String entityType,
            UUID entityPublicId,
            String metadata) {
        AuditLog entry = new AuditLog();
        entry.setTenantId(tenantId);
        entry.setAction(action);
        entry.setEntityType(entityType);
        entry.setEntityPublicId(entityPublicId);
        entry.setMetadata(metadata);

        if (actorUserId != null) {
            userRepository.findById(actorUserId).ifPresent(entry::setActor);
        }

        auditLogRepository.save(entry);
    }

    @Transactional(readOnly = true)
    @PreAuthorize("hasRole('ADMIN')")
    public List<AuditLogResponse> listLogs(AuditAction action) {
        Tenant tenant = tenantResolver.requireCurrentTenant();
        return auditLogRepository.findByTenantIdAndOptionalAction(tenant.getId(), action).stream()
                .map(this::toResponse)
                .toList();
    }

    public Long resolveCurrentActorUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthenticatedUser authenticatedUser)) {
            return null;
        }
        return userRepository.findByPublicId(authenticatedUser.getUserPublicId())
                .map(User::getId)
                .orElse(null);
    }

    private AuditLogResponse toResponse(AuditLog log) {
        NamedRef actor = null;
        if (log.getActor() != null) {
            actor = new NamedRef(log.getActor().getPublicId(), log.getActor().getName());
        }
        return new AuditLogResponse(
                log.getPublicId(),
                log.getAction(),
                actor,
                log.getEntityType(),
                log.getEntityPublicId(),
                log.getMetadata(),
                log.getCreatedAt()
        );
    }
}
