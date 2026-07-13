import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PhoneMaskDirective } from '../../../../core/directives/phone-mask.directive';
import {
  AvailabilitySlot,
  PublicProfessional,
  PublicService,
} from '../../../../core/services/public-salon.service';
import { buildWhatsAppUrl, isValidBrazilianPhone } from '../../../../core/utils/phone.util';

export type BookingStep = 'service' | 'professional' | 'datetime' | 'confirm' | 'done';

export type BookingConfirmation = {
  guestName: string;
  guestPhone: string;
  startAt: string;
  endAt: string;
  serviceName: string;
  serviceDurationMinutes: number;
  servicePrice: number;
  professionalName: string;
  professionalPhone?: string;
  salonName: string;
};

export type GuestBookingPayload = {
  guestName: string;
  guestPhone: string;
};

type StepItem = { id: BookingStep; label: string; number: number };

type CalendarDay = {
  date: Date;
  key: string;
  inMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isPast: boolean;
  isClosed: boolean;
};

@Component({
  selector: 'app-public-booking-wizard',
  standalone: true,
  imports: [ReactiveFormsModule, PhoneMaskDirective],
  templateUrl: './public-booking-wizard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicBookingWizardComponent {
  private readonly fb = inject(FormBuilder);

  readonly step = input.required<BookingStep>();
  readonly selectedService = input<PublicService | null>(null);
  readonly selectedProfessional = input<PublicProfessional | null>(null);
  readonly selectedDate = input<string | null>(null);
  readonly selectedSlot = input<AvailabilitySlot | null>(null);
  readonly confirmation = input<BookingConfirmation | null>(null);
  readonly professionals = input.required<PublicProfessional[]>();
  readonly professionalsLoading = input(false);
  readonly openDaysOfWeek = input.required<number[]>();
  readonly slots = input.required<AvailabilitySlot[]>();
  readonly slotsLoading = input(false);
  readonly slotsError = input<string | null>(null);
  readonly booking = input(false);
  readonly bookingError = input<string | null>(null);

  readonly backRequested = output<BookingStep>();
  readonly professionalSelected = output<PublicProfessional>();
  readonly dateSelected = output<string>();
  readonly slotSelected = output<AvailabilitySlot>();
  readonly continueRequested = output<void>();
  readonly bookingSubmitted = output<GuestBookingPayload>();
  readonly restartRequested = output<void>();
  readonly navigate = output<string>();

  protected readonly weekdayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

  protected readonly bookingSteps: StepItem[] = [
    { id: 'service', label: 'Servico', number: 1 },
    { id: 'professional', label: 'Profissional', number: 2 },
    { id: 'datetime', label: 'Data e horario', number: 3 },
    { id: 'confirm', label: 'Confirmar', number: 4 },
  ];

  protected readonly calendarMonth = signal(this.startOfMonth(new Date()));

  protected readonly monthLabel = computed(() =>
    new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(this.calendarMonth())
  );

  protected readonly calendarDays = computed(() => this.buildCalendarDays());

  protected readonly guestForm = this.fb.nonNullable.group({
    guestName: ['', [Validators.required, Validators.minLength(2)]],
    guestPhone: [
      '',
      [
        Validators.required,
        (control: AbstractControl) =>
          isValidBrazilianPhone(String(control.value ?? '')) ? null : { phone: true },
      ],
    ],
  });

  protected isStepActive(step: BookingStep): boolean {
    return this.step() === step;
  }

  protected isStepComplete(step: BookingStep): boolean {
    const order: BookingStep[] = ['service', 'professional', 'datetime', 'confirm', 'done'];
    return order.indexOf(this.step()) > order.indexOf(step);
  }

  protected selectDate(day: CalendarDay): void {
    if (day.isPast || !day.inMonth || day.isClosed) return;
    this.dateSelected.emit(day.key);
  }

  protected prevMonth(): void {
    const current = this.calendarMonth();
    this.calendarMonth.set(new Date(current.getFullYear(), current.getMonth() - 1, 1));
  }

  protected nextMonth(): void {
    const current = this.calendarMonth();
    this.calendarMonth.set(new Date(current.getFullYear(), current.getMonth() + 1, 1));
  }

  protected submitBooking(): void {
    if (this.guestForm.invalid || this.booking()) return;
    this.bookingSubmitted.emit(this.guestForm.getRawValue());
  }

  protected restart(): void {
    this.guestForm.reset();
    this.restartRequested.emit();
  }

  protected confirmationClientWhatsAppUrl(): string {
    const confirmation = this.confirmation();
    if (!confirmation) {
      return '#';
    }
    return buildWhatsAppUrl(confirmation.guestPhone, this.buildConfirmationMessage(confirmation));
  }

  protected confirmationProfessionalWhatsAppUrl(): string {
    const confirmation = this.confirmation();
    if (!confirmation?.professionalPhone) {
      return '#';
    }
    return buildWhatsAppUrl(
      confirmation.professionalPhone,
      this.buildProfessionalNotificationMessage(confirmation)
    );
  }

  protected formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  protected formatSlotTime(value: string): string {
    return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(
      new Date(value)
    );
  }

  protected formatSlotLabel(value: string): string {
    return new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  }

  protected formatTimeRange(startAt: string, endAt: string): string {
    const start = this.formatSlotTime(startAt);
    const end = this.formatSlotTime(endAt);
    return `${start} – ${end}`;
  }

  protected formatDateLabel(isoDate: string): string {
    const [year, month, day] = isoDate.split('-').map(Number);
    return new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date(year, month - 1, day));
  }

  private buildCalendarDays(): CalendarDay[] {
    const monthStart = this.calendarMonth();
    const year = monthStart.getFullYear();
    const month = monthStart.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = firstDay.getDay();
    const gridStart = new Date(year, month, 1 - startOffset);
    const todayKey = this.toIsoDate(new Date());
    const selected = this.selectedDate();
    const openDays = this.openDaysOfWeek();
    const days: CalendarDay[] = [];

    for (let i = 0; i < 42; i++) {
      const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
      const key = this.toIsoDate(date);
      const isPast = key < todayKey;
      const backendDay = this.backendDayOfWeek(date);
      const isClosed = openDays.length > 0 && !openDays.includes(backendDay);
      days.push({
        date,
        key,
        inMonth: date.getMonth() === month,
        isToday: key === todayKey,
        isSelected: selected === key,
        isPast,
        isClosed,
      });
    }

    return days;
  }

  private startOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  private toIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private backendDayOfWeek(date: Date): number {
    const jsDay = date.getDay();
    return jsDay === 0 ? 7 : jsDay;
  }

  private buildConfirmationMessage(confirmation: BookingConfirmation): string {
    return (
      `Ola! Meu agendamento no ${confirmation.salonName} foi confirmado.\n\n` +
      `Servico: ${confirmation.serviceName}\n` +
      `Profissional: ${confirmation.professionalName}\n` +
      `Horario: ${this.formatSlotLabel(confirmation.startAt)} (${this.formatTimeRange(confirmation.startAt, confirmation.endAt)})\n` +
      `Duracao: ${confirmation.serviceDurationMinutes} min\n` +
      `Valor: ${this.formatCurrency(confirmation.servicePrice)}`
    );
  }

  private buildProfessionalNotificationMessage(confirmation: BookingConfirmation): string {
    return (
      `Ola ${confirmation.professionalName}! Novo agendamento no ${confirmation.salonName}.\n\n` +
      `Cliente: ${confirmation.guestName}\n` +
      `WhatsApp: ${confirmation.guestPhone}\n` +
      `Servico: ${confirmation.serviceName}\n` +
      `Horario: ${this.formatSlotLabel(confirmation.startAt)} (${this.formatTimeRange(confirmation.startAt, confirmation.endAt)})`
    );
  }
}
