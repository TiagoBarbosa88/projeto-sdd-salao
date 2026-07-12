package br.com.salao.domain.repository;

import br.com.salao.domain.entity.ProfessionalProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProfessionalProfileRepository extends JpaRepository<ProfessionalProfile, Long> {

    Optional<ProfessionalProfile> findByTenantUser_Id(Long tenantUserId);

    @Query("""
            SELECT pp FROM ProfessionalProfile pp
            JOIN FETCH pp.tenantUser tu
            JOIN FETCH tu.user
            WHERE tu.tenant.id = :tenantId
              AND pp.bookable = true
              AND pp.active = true
            ORDER BY tu.user.name ASC
            """)
    List<ProfessionalProfile> findBookableByTenantId(@Param("tenantId") Long tenantId);

    @Query("""
            SELECT pp FROM ProfessionalProfile pp
            JOIN FETCH pp.tenantUser tu
            JOIN FETCH tu.user
            WHERE tu.tenant.id = :tenantId
            ORDER BY tu.user.name ASC
            """)
    List<ProfessionalProfile> findAllByTenantId(@Param("tenantId") Long tenantId);

    @Query("""
            SELECT pp FROM ProfessionalProfile pp
            JOIN FETCH pp.tenantUser tu
            JOIN FETCH tu.user
            WHERE tu.tenant.id = :tenantId
              AND tu.user.publicId = :userPublicId
            """)
    Optional<ProfessionalProfile> findByTenantIdAndUserPublicId(
            @Param("tenantId") Long tenantId,
            @Param("userPublicId") UUID userPublicId);
}
