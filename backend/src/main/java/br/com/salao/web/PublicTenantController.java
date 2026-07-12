package br.com.salao.web;

import br.com.salao.service.AvailabilityService;
import br.com.salao.service.PublicBookingService;
import br.com.salao.service.PublicTenantService;
import br.com.salao.web.dto.AppointmentResponse;
import br.com.salao.web.dto.AvailabilitySlotResponse;
import br.com.salao.web.dto.PublicGuestBookingRequest;
import br.com.salao.web.dto.PublicProfessionalResponse;
import br.com.salao.web.dto.PublicServiceResponse;
import br.com.salao.web.dto.PublicTenantResponse;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/public/tenants")
public class PublicTenantController {

    private final PublicTenantService publicTenantService;
    private final AvailabilityService availabilityService;
    private final PublicBookingService publicBookingService;

    public PublicTenantController(
            PublicTenantService publicTenantService,
            AvailabilityService availabilityService,
            PublicBookingService publicBookingService) {
        this.publicTenantService = publicTenantService;
        this.availabilityService = availabilityService;
        this.publicBookingService = publicBookingService;
    }

    @GetMapping("/{slug}")
    public PublicTenantResponse getTenant(@PathVariable String slug) {
        return publicTenantService.getTenantBySlug(slug);
    }

    @GetMapping("/{slug}/services")
    public List<PublicServiceResponse> listServices(@PathVariable String slug) {
        return publicTenantService.getActiveServicesBySlug(slug);
    }

    @GetMapping("/{slug}/professionals")
    public List<PublicProfessionalResponse> listProfessionals(@PathVariable String slug) {
        return publicTenantService.getBookableProfessionalsBySlug(slug);
    }

    @GetMapping("/{slug}/availability/slots")
    public List<AvailabilitySlotResponse> getSlots(
            @PathVariable String slug,
            @RequestParam UUID professionalPublicId,
            @RequestParam UUID servicePublicId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return availabilityService.getAvailableSlotsBySlug(slug, professionalPublicId, servicePublicId, date);
    }

    @PostMapping("/{slug}/appointments")
    @ResponseStatus(HttpStatus.CREATED)
    public AppointmentResponse createGuestAppointment(
            @PathVariable String slug,
            @RequestBody PublicGuestBookingRequest request) {
        return publicBookingService.createGuestAppointment(slug, request);
    }
}
