package br.com.salao.domain.repository;

import br.com.salao.domain.entity.SalonService;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SalonServiceRepository extends JpaRepository<SalonService, Long> {

    List<SalonService> findByTenantIdOrderByNameAsc(Long tenantId);

    Optional<SalonService> findByPublicIdAndTenantId(UUID publicId, Long tenantId);
}
