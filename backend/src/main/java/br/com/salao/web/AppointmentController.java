package br.com.salao.web;

import br.com.salao.service.AppointmentService;
import br.com.salao.web.dto.AppointmentResponse;
import br.com.salao.web.dto.CreateAppointmentRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/appointments")
public class AppointmentController {

    private final AppointmentService appointmentService;

    public AppointmentController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    @GetMapping
    public List<AppointmentResponse> listAppointments() {
        return appointmentService.listAppointments();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AppointmentResponse createAppointment(@Valid @RequestBody CreateAppointmentRequest request) {
        return appointmentService.createAppointment(request);
    }

    @PatchMapping("/{publicId}/cancel")
    public AppointmentResponse cancelAppointment(@PathVariable UUID publicId) {
        return appointmentService.cancelAppointment(publicId);
    }
}
