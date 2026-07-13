import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AvailabilitySlot,
  PublicProfessional,
  PublicSalonService,
  PublicService,
  PublicTenant,
} from '../../core/services/public-salon.service';
import { normalizePhoneValue } from '../../core/utils/phone.util';
import { scrollToSection } from '../../core/utils/scroll.util';
import {
  BookingConfirmation,
  BookingStep,
  GuestBookingPayload,
  PublicBookingWizardComponent,
} from './components/public-booking-wizard/public-booking-wizard.component';
import { PublicSalonFooterComponent } from './components/public-salon-footer/public-salon-footer.component';
import { PublicSalonHeaderComponent } from './components/public-salon-header/public-salon-header.component';
import { PublicSalonHeroComponent } from './components/public-salon-hero/public-salon-hero.component';
import {
  NavSection,
  PublicSalonMobileNavComponent,
} from './components/public-salon-mobile-nav/public-salon-mobile-nav.component';
import { PublicSalonServicesComponent } from './components/public-salon-services/public-salon-services.component';

@Component({
  selector: 'app-public-salon',
  standalone: true,
  imports: [
    PublicSalonHeaderComponent,
    PublicSalonHeroComponent,
    PublicSalonServicesComponent,
    PublicBookingWizardComponent,
    PublicSalonFooterComponent,
    PublicSalonMobileNavComponent,
  ],
  templateUrl: './public-salon.component.html',
})
export class PublicSalonComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly publicSalon = inject(PublicSalonService);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  protected readonly navSections: NavSection[] = [
    { id: 'inicio', label: 'Quem somos', mobileLabel: 'Inicio', icon: 'home' },
    { id: 'servicos', label: 'Servicos', mobileLabel: 'Servicos', icon: 'services' },
    { id: 'agenda', label: 'Agenda', mobileLabel: 'Agenda', icon: 'calendar' },
    { id: 'endereco', label: 'Endereco', mobileLabel: 'Mapa', icon: 'map' },
    { id: 'contato', label: 'Contato', mobileLabel: 'Contato', icon: 'contact' },
  ];

  protected readonly activeSection = signal('inicio');

  protected readonly tenant = signal<PublicTenant | null>(null);
  protected readonly services = signal<PublicService[]>([]);
  protected readonly professionals = signal<PublicProfessional[]>([]);
  protected readonly slots = signal<AvailabilitySlot[]>([]);

  protected readonly loading = signal(true);
  protected readonly professionalsLoading = signal(false);
  protected readonly slotsLoading = signal(false);
  protected readonly booking = signal(false);

  protected readonly error = signal<string | null>(null);
  protected readonly slotsError = signal<string | null>(null);
  protected readonly bookingError = signal<string | null>(null);

  protected readonly step = signal<BookingStep>('service');
  protected readonly selectedService = signal<PublicService | null>(null);
  protected readonly selectedProfessional = signal<PublicProfessional | null>(null);
  protected readonly openDaysOfWeek = signal<number[]>([]);
  protected readonly selectedDate = signal<string | null>(null);
  protected readonly selectedSlot = signal<AvailabilitySlot | null>(null);
  protected readonly confirmation = signal<BookingConfirmation | null>(null);

  private slug = '';
  private sectionObserver?: IntersectionObserver;

  protected readonly aboutText = computed(() => {
    const tenant = this.tenant();
    const description = tenant?.description?.trim();
    if (description) {
      return description;
    }
    return `Somos o ${tenant?.name ?? 'salao'}, prontos para cuidar do seu visual com atendimento personalizado e agendamento online rapido.`;
  });

  ngOnInit(): void {
    this.slug = this.route.snapshot.paramMap.get('slug') ?? environment.publicTenantSlug;
    if (!this.slug) {
      this.error.set('Salao invalido.');
      this.loading.set(false);
      return;
    }

    forkJoin({
      tenant: this.publicSalon.getTenant(this.slug),
      services: this.publicSalon.listServices(this.slug),
    }).subscribe({
      next: ({ tenant, services }) => {
        this.tenant.set(tenant);
        this.services.set(services);
        this.applySeo(tenant);
        this.loading.set(false);
        queueMicrotask(() => this.setupSectionObserver());
      },
      error: () => {
        this.error.set('Salao nao encontrado ou indisponivel.');
        this.loading.set(false);
      },
    });
  }

  ngOnDestroy(): void {
    this.sectionObserver?.disconnect();
  }

  protected scrollTo(sectionId: string): void {
    this.activeSection.set(sectionId);
    scrollToSection(sectionId);
  }

  protected selectService(service: PublicService): void {
    this.selectedService.set(service);
    this.selectedProfessional.set(null);
    this.selectedDate.set(null);
    this.selectedSlot.set(null);
    this.slots.set([]);
    this.step.set('professional');
    this.loadProfessionals();
    scrollToSection('agenda');
  }

  protected selectProfessional(pro: PublicProfessional): void {
    this.selectedProfessional.set(pro);
    this.openDaysOfWeek.set(pro.openDaysOfWeek ?? []);
    this.selectedDate.set(null);
    this.selectedSlot.set(null);
    this.slots.set([]);
    this.step.set('datetime');
  }

  protected selectDate(isoDate: string): void {
    this.selectedDate.set(isoDate);
    this.selectedSlot.set(null);
    this.loadSlots(isoDate);
  }

  protected selectSlot(slot: AvailabilitySlot): void {
    this.selectedSlot.set(slot);
  }

  protected goBack(target: BookingStep): void {
    this.step.set(target);
    this.bookingError.set(null);
    if (target === 'service') {
      scrollToSection('servicos');
    }
  }

  protected confirmBooking(payload: GuestBookingPayload): void {
    const service = this.selectedService();
    const professional = this.selectedProfessional();
    const slot = this.selectedSlot();
    if (!service || !professional || !slot || this.booking()) return;

    this.booking.set(true);
    this.bookingError.set(null);
    const normalizedPhone = normalizePhoneValue(payload.guestPhone) ?? payload.guestPhone;

    this.publicSalon
      .createGuestAppointment(this.slug, {
        servicePublicId: service.publicId,
        professionalPublicId: professional.publicId,
        startAt: slot.startAt,
        guestName: payload.guestName,
        guestPhone: normalizedPhone,
      })
      .subscribe({
        next: (response) => {
          this.booking.set(false);
          this.confirmation.set({
            guestName: response.guestName,
            guestPhone: normalizedPhone,
            startAt: response.startAt,
            endAt: response.endAt,
            serviceName: service.name,
            serviceDurationMinutes: service.durationMinutes,
            servicePrice: service.price,
            professionalName: professional.name,
            salonName: this.tenant()?.name ?? 'Salao',
          });
          this.step.set('done');
          scrollToSection('agenda');
        },
        error: (err) => {
          this.booking.set(false);
          const message =
            err?.error?.message ?? 'Este horario nao esta mais disponivel. Escolha outro.';
          this.bookingError.set(message);
        },
      });
  }

  protected restartBooking(): void {
    this.step.set('service');
    this.selectedService.set(null);
    this.selectedProfessional.set(null);
    this.selectedDate.set(null);
    this.selectedSlot.set(null);
    this.confirmation.set(null);
    this.bookingError.set(null);
    scrollToSection('servicos');
  }

  private loadProfessionals(): void {
    this.professionalsLoading.set(true);
    this.publicSalon.listProfessionals(this.slug).subscribe({
      next: (items) => {
        this.professionals.set(items);
        this.professionalsLoading.set(false);
      },
      error: () => {
        this.professionalsLoading.set(false);
        this.error.set('Nao foi possivel carregar profissionais.');
      },
    });
  }

  private loadSlots(isoDate: string): void {
    const service = this.selectedService();
    const professional = this.selectedProfessional();
    if (!service || !professional) return;

    this.slotsLoading.set(true);
    this.slotsError.set(null);
    this.publicSalon
      .getAvailabilitySlots(this.slug, professional.publicId, service.publicId, isoDate)
      .subscribe({
        next: (items) => {
          this.slots.set(items);
          this.slotsLoading.set(false);
        },
        error: () => {
          this.slotsLoading.set(false);
          this.slotsError.set('Nao foi possivel carregar horarios.');
        },
      });
  }

  private applySeo(tenant: PublicTenant): void {
    const title = tenant.seoTitle?.trim() || `${tenant.name} | Agende online`;
    const description =
      tenant.seoDescription?.trim() ||
      tenant.description?.trim() ||
      `Agende online no ${tenant.name}.`;

    this.title.setTitle(title);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    if (tenant.seoImageUrl) {
      this.meta.updateTag({ property: 'og:image', content: tenant.seoImageUrl });
    }
  }

  private setupSectionObserver(): void {
    this.sectionObserver?.disconnect();

    const visibleSections = this.navSections
      .map((section) => {
        const element = document.getElementById(section.id);
        return element ? { id: section.id, element } : null;
      })
      .filter((section): section is { id: string; element: HTMLElement } => section !== null);

    if (visibleSections.length === 0) {
      return;
    }

    this.sectionObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible.length > 0) {
          this.activeSection.set(visible[0].target.id);
        }
      },
      {
        root: null,
        rootMargin: '-40% 0px -45% 0px',
        threshold: [0, 0.15, 0.35, 0.55],
      }
    );

    for (const section of visibleSections) {
      this.sectionObserver.observe(section.element);
    }
  }
}
