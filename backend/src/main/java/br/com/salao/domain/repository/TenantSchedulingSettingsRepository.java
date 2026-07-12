package br.com.salao.domain.repository;

import br.com.salao.domain.entity.TenantSchedulingSettings;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TenantSchedulingSettingsRepository extends JpaRepository<TenantSchedulingSettings, Long> {

    Optional<TenantSchedulingSettings> findByTenant_Id(Long tenantId);
}
