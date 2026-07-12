package br.com.salao.service;

import br.com.salao.domain.entity.TenantSchedulingSettings;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.List;

@Service
public class PublicBusinessHoursService {

    private final SalonSettingsService salonSettingsService;

    public PublicBusinessHoursService(SalonSettingsService salonSettingsService) {
        this.salonSettingsService = salonSettingsService;
    }

    @Transactional(readOnly = true)
    public List<String> buildLines(Long tenantId) {
        TenantSchedulingSettings settings = salonSettingsService.requireSchedulingSettingsForTenant(tenantId);
        String line = "Segunda a Sabado das "
                + formatTime(settings.getDayStartTime())
                + " as "
                + formatTime(settings.getDayEndTime());
        return List.of(line);
    }

    private String formatTime(LocalTime time) {
        if (time.getMinute() == 0) {
            return time.getHour() + "h";
        }
        return String.format("%02d:%02d", time.getHour(), time.getMinute());
    }
}
