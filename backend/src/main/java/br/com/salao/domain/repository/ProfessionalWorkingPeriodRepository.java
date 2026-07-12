package br.com.salao.domain.repository;

import br.com.salao.domain.entity.ProfessionalWorkingPeriod;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProfessionalWorkingPeriodRepository extends JpaRepository<ProfessionalWorkingPeriod, Long> {

    List<ProfessionalWorkingPeriod> findByTenantUser_IdOrderByDayOfWeekAscStartTimeAsc(Long tenantUserId);

    List<ProfessionalWorkingPeriod> findByTenantUser_IdAndDayOfWeek(Long tenantUserId, int dayOfWeek);

    void deleteByTenantUser_Id(Long tenantUserId);

    Optional<ProfessionalWorkingPeriod> findByPublicIdAndTenantUser_Id(UUID publicId, Long tenantUserId);
}
