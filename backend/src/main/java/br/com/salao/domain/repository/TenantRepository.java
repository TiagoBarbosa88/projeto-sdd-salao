package br.com.salao.domain.repository;

import br.com.salao.domain.entity.Tenant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface TenantRepository extends JpaRepository<Tenant, Long> {

    Optional<Tenant> findBySlug(String slug);

    boolean existsBySlug(String slug);

    Optional<Tenant> findByPublicId(UUID publicId);
}
