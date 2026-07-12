package br.com.salao.web;

import br.com.salao.service.AvailabilityService;
import br.com.salao.web.dto.AvailabilitySlotResponse;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/availability")
public class AvailabilityController {

    private final AvailabilityService availabilityService;

    public AvailabilityController(AvailabilityService availabilityService) {
        this.availabilityService = availabilityService;
    }

    @GetMapping("/slots")
    public List<AvailabilitySlotResponse> getSlots(
            @RequestParam UUID professionalPublicId,
            @RequestParam UUID servicePublicId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return availabilityService.getAvailableSlots(professionalPublicId, servicePublicId, date);
    }
}
