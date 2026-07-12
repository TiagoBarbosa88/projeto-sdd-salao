package br.com.salao.web;

import br.com.salao.service.SalonSettingsService;
import br.com.salao.web.dto.SalonSettingsResponse;
import br.com.salao.web.dto.SchedulingSettingsResponse;
import br.com.salao.web.dto.UpdateSalonSettingsRequest;
import br.com.salao.web.dto.UpdateSchedulingSettingsRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/settings")
public class SalonSettingsController {

    private final SalonSettingsService salonSettingsService;

    public SalonSettingsController(SalonSettingsService salonSettingsService) {
        this.salonSettingsService = salonSettingsService;
    }

    @GetMapping("/salon")
    public SalonSettingsResponse getSalonSettings() {
        return salonSettingsService.getSalonSettings();
    }

    @PutMapping("/salon")
    public SalonSettingsResponse updateSalonSettings(@RequestBody UpdateSalonSettingsRequest request) {
        return salonSettingsService.updateSalonSettings(request);
    }

    @GetMapping("/scheduling")
    public SchedulingSettingsResponse getSchedulingSettings() {
        return salonSettingsService.getSchedulingSettings();
    }

    @PutMapping("/scheduling")
    public SchedulingSettingsResponse updateSchedulingSettings(@RequestBody UpdateSchedulingSettingsRequest request) {
        return salonSettingsService.updateSchedulingSettings(request);
    }
}
