package br.com.salao.domain.repository;

import br.com.salao.domain.entity.AuditAction;
import br.com.salao.domain.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    @Query("""
            SELECT a FROM AuditLog a
            LEFT JOIN FETCH a.actor
            WHERE a.tenantId = :tenantId
            AND (:action IS NULL OR a.action = :action)
            AND (:from IS NULL OR a.createdAt >= :from)
            AND (:to IS NULL OR a.createdAt < :to)
            ORDER BY a.createdAt DESC
            """)
    List<AuditLog> findByTenantIdAndFilters(
            @Param("tenantId") Long tenantId,
            @Param("action") AuditAction action,
            @Param("from") OffsetDateTime from,
            @Param("to") OffsetDateTime to);
}
