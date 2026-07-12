package br.com.salao.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalTime;

@Entity
@Table(name = "tenant_scheduling_settings")
public class TenantSchedulingSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tenant_id", nullable = false, unique = true)
    private Tenant tenant;

    @Column(name = "zone_id", nullable = false, length = 100)
    private String zoneId = "America/Sao_Paulo";

    @Column(name = "buffer_minutes", nullable = false)
    private int bufferMinutes = 15;

    @Column(name = "slot_interval_minutes", nullable = false)
    private int slotIntervalMinutes = 30;

    @JdbcTypeCode(SqlTypes.TIME)
    @Column(name = "day_start_time", nullable = false)
    private LocalTime dayStartTime = LocalTime.of(9, 0);

    @JdbcTypeCode(SqlTypes.TIME)
    @Column(name = "day_end_time", nullable = false)
    private LocalTime dayEndTime = LocalTime.of(22, 0);

    public Long getId() {
        return id;
    }

    public Tenant getTenant() {
        return tenant;
    }

    public void setTenant(Tenant tenant) {
        this.tenant = tenant;
    }

    public String getZoneId() {
        return zoneId;
    }

    public void setZoneId(String zoneId) {
        this.zoneId = zoneId;
    }

    public int getBufferMinutes() {
        return bufferMinutes;
    }

    public void setBufferMinutes(int bufferMinutes) {
        this.bufferMinutes = bufferMinutes;
    }

    public int getSlotIntervalMinutes() {
        return slotIntervalMinutes;
    }

    public void setSlotIntervalMinutes(int slotIntervalMinutes) {
        this.slotIntervalMinutes = slotIntervalMinutes;
    }

    public LocalTime getDayStartTime() {
        return dayStartTime;
    }

    public void setDayStartTime(LocalTime dayStartTime) {
        this.dayStartTime = dayStartTime;
    }

    public LocalTime getDayEndTime() {
        return dayEndTime;
    }

    public void setDayEndTime(LocalTime dayEndTime) {
        this.dayEndTime = dayEndTime;
    }
}
