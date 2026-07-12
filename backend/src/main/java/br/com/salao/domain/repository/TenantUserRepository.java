package br.com.salao.domain.repository;

import br.com.salao.domain.entity.Role;
import br.com.salao.domain.entity.TenantUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TenantUserRepository extends JpaRepository<TenantUser, Long> {

    List<TenantUser> findByUserId(Long userId);

    @Query("SELECT tu FROM TenantUser tu JOIN FETCH tu.tenant JOIN FETCH tu.user WHERE tu.user.id = :userId ORDER BY tu.id")
    List<TenantUser> findAllByUserIdWithTenant(@Param("userId") Long userId);

    Optional<TenantUser> findByUserIdAndTenantId(Long userId, Long tenantId);

    Optional<TenantUser> findByTenant_IdAndUser_PublicId(Long tenantId, UUID userPublicId);

    long countByTenant_IdAndRole(Long tenantId, Role role);
}
