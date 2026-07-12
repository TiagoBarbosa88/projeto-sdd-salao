package br.com.salao.service;

import br.com.salao.domain.entity.Appointment;
import br.com.salao.domain.entity.ProfessionalProfile;
import br.com.salao.domain.entity.SalonService;
import br.com.salao.domain.entity.Tenant;
import br.com.salao.domain.entity.TenantUser;
import br.com.salao.domain.entity.User;
import br.com.salao.domain.repository.ProfessionalProfileRepository;
import br.com.salao.notification.WhatsAppNotifier;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AppointmentWhatsAppServiceTest {

    @Mock
    private WhatsAppNotifier whatsAppNotifier;

    @Mock
    private ProfessionalProfileRepository professionalProfileRepository;

    @InjectMocks
    private AppointmentWhatsAppService appointmentWhatsAppService;

    @Test
    void notifiesGuestAndProfessional() {
        Tenant tenant = mock(Tenant.class);
        when(tenant.getId()).thenReturn(1L);
        when(tenant.getName()).thenReturn("Salao Marina");

        UUID professionalPublicId = UUID.randomUUID();
        User professionalUser = mock(User.class);
        when(professionalUser.getPublicId()).thenReturn(professionalPublicId);
        when(professionalUser.getName()).thenReturn("Marina");

        SalonService service = new SalonService();
        service.setName("Acabamento");

        Appointment appointment = new Appointment();
        appointment.setGuestName("Maria");
        appointment.setGuestPhone("(11) 84787-8878");
        appointment.setProfessional(professionalUser);
        appointment.setService(service);
        appointment.setStartAt(OffsetDateTime.of(2026, 7, 14, 16, 30, 0, 0, ZoneOffset.of("-03:00")));

        ProfessionalProfile profile = new ProfessionalProfile();
        profile.setPhone("(11) 98888-7777");
        TenantUser tenantUser = new TenantUser();
        tenantUser.setUser(professionalUser);
        profile.setTenantUser(tenantUser);

        when(professionalProfileRepository.findByTenantIdAndUserPublicId(eq(1L), eq(professionalPublicId)))
                .thenReturn(Optional.of(profile));

        appointmentWhatsAppService.notifyGuestBooking(tenant, appointment);

        ArgumentCaptor<String> phoneCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> messageCaptor = ArgumentCaptor.forClass(String.class);
        verify(whatsAppNotifier, times(2)).sendMessage(phoneCaptor.capture(), messageCaptor.capture());

        assertThat(phoneCaptor.getAllValues()).containsExactlyInAnyOrder("(11) 84787-8878", "(11) 98888-7777");
        assertThat(messageCaptor.getAllValues().get(0)).contains("Maria");
        assertThat(messageCaptor.getAllValues().get(1)).contains("Novo agendamento");
    }

    @Test
    void skipsProfessionalWhenPhoneMissing() {
        Tenant tenant = mock(Tenant.class);
        when(tenant.getId()).thenReturn(1L);
        when(tenant.getName()).thenReturn("Salao Marina");

        User professionalUser = mock(User.class);
        when(professionalUser.getPublicId()).thenReturn(UUID.randomUUID());
        when(professionalUser.getName()).thenReturn("Marina");

        SalonService service = new SalonService();
        service.setName("Acabamento");

        Appointment appointment = new Appointment();
        appointment.setGuestName("Maria");
        appointment.setGuestPhone("(11) 84787-8878");
        appointment.setProfessional(professionalUser);
        appointment.setService(service);
        appointment.setStartAt(OffsetDateTime.of(2026, 7, 14, 16, 30, 0, 0, ZoneOffset.of("-03:00")));

        when(professionalProfileRepository.findByTenantIdAndUserPublicId(any(), any()))
                .thenReturn(Optional.empty());

        appointmentWhatsAppService.notifyGuestBooking(tenant, appointment);

        verify(whatsAppNotifier, times(1)).sendMessage(eq("(11) 84787-8878"), any());
    }
}
