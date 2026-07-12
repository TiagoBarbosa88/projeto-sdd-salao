package br.com.salao.service;

import br.com.salao.domain.entity.Appointment;
import br.com.salao.domain.entity.ProfessionalProfile;
import br.com.salao.domain.entity.Tenant;
import br.com.salao.domain.repository.ProfessionalProfileRepository;
import br.com.salao.notification.WhatsAppNotifier;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Service
public class AppointmentWhatsAppService {

    private static final DateTimeFormatter SLOT_FORMAT = DateTimeFormatter.ofPattern(
            "EEEE, d 'de' MMMM 'as' HH:mm",
            Locale.forLanguageTag("pt-BR"));

    private final WhatsAppNotifier whatsAppNotifier;
    private final ProfessionalProfileRepository professionalProfileRepository;

    public AppointmentWhatsAppService(
            WhatsAppNotifier whatsAppNotifier,
            ProfessionalProfileRepository professionalProfileRepository) {
        this.whatsAppNotifier = whatsAppNotifier;
        this.professionalProfileRepository = professionalProfileRepository;
    }

    public void notifyGuestBooking(Tenant tenant, Appointment appointment) {
        String salonName = tenant.getName() != null ? tenant.getName().trim() : "Salao";
        String slotLabel = SLOT_FORMAT.format(appointment.getStartAt());
        String serviceName = appointment.getService().getName();
        String professionalName = appointment.getProfessional().getName();
        String guestName = appointment.getGuestName() != null ? appointment.getGuestName().trim() : "Cliente";

        if (appointment.getGuestPhone() != null && !appointment.getGuestPhone().isBlank()) {
            String guestMessage = "Ola, " + guestName + "! Seu agendamento no " + salonName + " foi confirmado.\n\n"
                    + "Servico: " + serviceName + "\n"
                    + "Profissional: " + professionalName + "\n"
                    + "Horario: " + slotLabel + "\n\n"
                    + "Qualquer duvida, estamos a disposicao.";
            whatsAppNotifier.sendMessage(appointment.getGuestPhone(), guestMessage);
        }

        professionalProfileRepository
                .findByTenantIdAndUserPublicId(
                        tenant.getId(), appointment.getProfessional().getPublicId())
                .map(ProfessionalProfile::getPhone)
                .filter(phone -> phone != null && !phone.isBlank())
                .ifPresent(phone -> {
                    String professionalMessage = "Novo agendamento no " + salonName + ".\n\n"
                            + "Cliente: " + guestName + "\n"
                            + "WhatsApp: " + (appointment.getGuestPhone() != null ? appointment.getGuestPhone() : "-") + "\n"
                            + "Servico: " + serviceName + "\n"
                            + "Horario: " + slotLabel;
                    whatsAppNotifier.sendMessage(phone, professionalMessage);
                });
    }
}
