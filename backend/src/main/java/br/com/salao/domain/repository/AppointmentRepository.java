package br.com.salao.domain.repository;

import br.com.salao.domain.entity.Appointment;
import br.com.salao.domain.entity.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    @Query("""
            SELECT a FROM Appointment a
            JOIN FETCH a.service
            JOIN FETCH a.professional
            JOIN FETCH a.client
            WHERE a.tenantId = :tenantId
            ORDER BY a.startAt ASC
            """)
    List<Appointment> findAllByTenantIdWithDetails(@Param("tenantId") Long tenantId);

    @Query("""
            SELECT a FROM Appointment a
            JOIN FETCH a.service
            JOIN FETCH a.professional
            JOIN FETCH a.client
            WHERE a.tenantId = :tenantId AND a.professional.id = :professionalId
            ORDER BY a.startAt ASC
            """)
    List<Appointment> findByTenantIdAndProfessionalIdWithDetails(
            @Param("tenantId") Long tenantId,
            @Param("professionalId") Long professionalId);

    @Query("""
            SELECT a FROM Appointment a
            JOIN FETCH a.service
            JOIN FETCH a.professional
            JOIN FETCH a.client
            WHERE a.tenantId = :tenantId AND a.client.id = :clientId
            ORDER BY a.startAt ASC
            """)
    List<Appointment> findByTenantIdAndClientIdWithDetails(
            @Param("tenantId") Long tenantId,
            @Param("clientId") Long clientId);

    Optional<Appointment> findByPublicIdAndTenantId(UUID publicId, Long tenantId);

    @Query("""
            SELECT a FROM Appointment a
            JOIN FETCH a.service
            JOIN FETCH a.professional
            JOIN FETCH a.client
            WHERE a.publicId = :publicId AND a.tenantId = :tenantId
            """)
    Optional<Appointment> findByPublicIdAndTenantIdWithDetails(
            @Param("publicId") UUID publicId,
            @Param("tenantId") Long tenantId);

    @Query("""
            SELECT COUNT(a) > 0 FROM Appointment a
            WHERE a.tenantId = :tenantId
              AND a.professional.id = :professionalId
              AND a.status <> :cancelledStatus
              AND a.startAt < :endAt
              AND a.endAt > :startAt
            """)
    boolean existsConflict(
            @Param("tenantId") Long tenantId,
            @Param("professionalId") Long professionalId,
            @Param("startAt") OffsetDateTime startAt,
            @Param("endAt") OffsetDateTime endAt,
            @Param("cancelledStatus") AppointmentStatus cancelledStatus);

    @Query("""
            SELECT a FROM Appointment a
            JOIN FETCH a.service
            WHERE a.tenantId = :tenantId
              AND a.status <> :cancelledStatus
              AND a.startAt >= :dayStart
              AND a.startAt < :dayEnd
            """)
    List<Appointment> findActiveByTenantIdAndDay(
            @Param("tenantId") Long tenantId,
            @Param("dayStart") OffsetDateTime dayStart,
            @Param("dayEnd") OffsetDateTime dayEnd,
            @Param("cancelledStatus") AppointmentStatus cancelledStatus);
}
