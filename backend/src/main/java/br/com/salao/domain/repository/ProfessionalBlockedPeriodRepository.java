package br.com.salao.domain.repository;

import br.com.salao.domain.entity.ProfessionalBlockedPeriod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProfessionalBlockedPeriodRepository extends JpaRepository<ProfessionalBlockedPeriod, Long> {

    List<ProfessionalBlockedPeriod> findByTenantUser_IdOrderByStartAtAsc(Long tenantUserId);

    Optional<ProfessionalBlockedPeriod> findByPublicIdAndTenantUser_Id(UUID publicId, Long tenantUserId);

    @Query("""
            SELECT bp FROM ProfessionalBlockedPeriod bp
            WHERE bp.tenantUser.id = :tenantUserId
              AND bp.startAt < :rangeEnd
              AND bp.endAt > :rangeStart
            ORDER BY bp.startAt ASC
            """)
    List<ProfessionalBlockedPeriod> findOverlapping(
            @Param("tenantUserId") Long tenantUserId,
            @Param("rangeStart") OffsetDateTime rangeStart,
            @Param("rangeEnd") OffsetDateTime rangeEnd);
}
