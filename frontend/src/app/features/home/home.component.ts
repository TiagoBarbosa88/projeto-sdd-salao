import { Component, computed, inject, signal } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { SalonService, ServiceService } from '../../core/services/service.service';
import { Appointment, AppointmentService } from '../../core/services/appointment.service';
import { TeamMember, TeamService } from '../../core/services/team.service';
import {
  AgendaViewMode,
  getPeriodRange,
  startOfDay,
  toDateInputValue,
} from '../../core/utils/agenda-date.util';
import { AgendaCalendarComponent } from './components/agenda-calendar/agenda-calendar.component';
import { AppointmentFormComponent } from './components/appointment-form/appointment-form.component';
import { AppointmentListComponent } from './components/appointment-list/appointment-list.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [AppointmentFormComponent, AgendaCalendarComponent, AppointmentListComponent],
  templateUrl: './home.component.html',
})
export class HomeComponent {
  private readonly appointmentApi = inject(AppointmentService);
  private readonly serviceApi = inject(ServiceService);
  private readonly teamApi = inject(TeamService);
  private readonly auth = inject(AuthService);

  protected readonly appointments = signal<Appointment[]>([]);
  protected readonly activeServices = signal<SalonService[]>([]);
  protected readonly professionals = signal<TeamMember[]>([]);
  protected readonly clients = signal<TeamMember[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly showForm = signal(false);
  protected readonly cancellingId = signal<string | null>(null);
  protected readonly isClient = signal(false);
  protected readonly isStaff = signal(false);
  protected readonly currentUserPublicId = signal<string | null>(null);
  protected readonly currentUserName = signal<string | null>(null);
  protected readonly currentRole = signal<string | null>(null);
  protected readonly viewMode = signal<AgendaViewMode>('day');
  protected readonly referenceDate = signal(startOfDay(new Date()));

  protected readonly filteredAppointments = computed(() => {
    const reference = this.referenceDate();
    const mode = this.viewMode();
    const { start, end } = getPeriodRange(reference, mode);
    const items = this.appointments();
    const filtered = items
      .filter(
        (item) =>
          item.status !== 'CANCELLED' && this.isWithinPeriod(item.startAt, start, end)
      )
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

    this.debugAgenda('Filtro aplicado', {
      viewMode: mode,
      reference: toDateInputValue(reference),
      periodStart: start.toISOString(),
      periodEnd: end.toISOString(),
      total: items.length,
      matched: filtered.length,
      appointments: items.map((item) => ({
        startAt: item.startAt,
        localDay: toDateInputValue(new Date(item.startAt)),
        inPeriod: this.isWithinPeriod(item.startAt, start, end),
      })),
    });

    return filtered;
  });

  protected readonly outOfPeriodAppointments = computed(() => {
    const { start, end } = getPeriodRange(this.referenceDate(), this.viewMode());
    return this.appointments()
      .filter(
        (item) =>
          item.status !== 'CANCELLED' && !this.isWithinPeriod(item.startAt, start, end)
      )
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  });

  protected readonly periodSummary = computed(() => {
    const inPeriod = this.filteredAppointments().length;
    const activeTotal = this.appointments().filter((item) => item.status !== 'CANCELLED').length;
    return {
      inPeriod,
      outOfPeriod: activeTotal - inPeriod,
      total: activeTotal,
    };
  });

  protected readonly sameDayDifferentYearAppointments = computed(() => {
    const reference = this.referenceDate();
    const month = reference.getMonth();
    const day = reference.getDate();
    const year = reference.getFullYear();

    return this.appointments().filter((item) => {
      const date = new Date(item.startAt);
      return date.getMonth() === month && date.getDate() === day && date.getFullYear() !== year;
    });
  });

  protected readonly periodLabel = computed(() => {
    const { start, end } = getPeriodRange(this.referenceDate(), this.viewMode());
    const formatter = new Intl.DateTimeFormat('pt-BR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    if (this.viewMode() === 'day') {
      return formatter.format(start);
    }

    return `${formatter.format(start)} — ${formatter.format(end)}`;
  });

  constructor() {
    this.auth.getMe().subscribe({
      next: (profile) => {
        this.isClient.set(profile.role === 'CLIENT');
        this.isStaff.set(profile.role === 'ADMIN' || profile.role === 'PROFESSIONAL');
        this.currentUserPublicId.set(profile.user.publicId);
        this.currentUserName.set(profile.user.name);
        this.currentRole.set(profile.role);
      },
      error: () => this.error.set('Nao foi possivel carregar o perfil.'),
    });

    this.loadData();
    this.serviceApi.list().subscribe({
      next: (services) => this.activeServices.set(services.filter((s) => s.active)),
      error: () => {},
    });

    this.teamApi.getMembers('PROFESSIONAL').subscribe({
      next: (members) => this.professionals.set(members),
      error: () => {},
    });

    this.teamApi.getMembers('CLIENT').subscribe({
      next: (members) => this.clients.set(members),
      error: () => {},
    });
  }

  protected toggleForm(): void {
    this.showForm.set(!this.showForm());
  }

  protected onAppointmentCreated(startAt: string): void {
    this.showForm.set(false);
    this.goToAppointmentDate(startAt);
    this.loadData();
  }

  protected goToAppointmentDate(isoDate: string): void {
    const date = new Date(isoDate);
    this.referenceDate.set(
      startOfDay(new Date(date.getFullYear(), date.getMonth(), date.getDate())),
    );
    this.viewMode.set('day');
  }

  protected cancel(appointment: Appointment): void {
    if (!confirm('Cancelar este agendamento?')) {
      return;
    }

    this.cancellingId.set(appointment.publicId);
    this.appointmentApi.cancel(appointment.publicId).subscribe({
      next: () => {
        this.cancellingId.set(null);
        this.loadData();
      },
      error: () => {
        this.error.set('Nao foi possivel cancelar o agendamento.');
        this.cancellingId.set(null);
      },
    });
  }

  private loadData(): void {
    this.loading.set(true);
    this.error.set(null);

    this.appointmentApi.list().subscribe({
      next: (items) => {
        this.appointments.set(items);
        this.debugAgenda('Agendamentos carregados', items);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Nao foi possivel carregar os agendamentos.');
        this.loading.set(false);
      },
    });
  }

  private isWithinPeriod(isoDate: string, periodStart: Date, periodEnd: Date): boolean {
    const startAt = new Date(isoDate).getTime();
    return startAt >= periodStart.getTime() && startAt <= periodEnd.getTime();
  }

  private debugAgenda(message: string, data?: unknown): void {
    console.debug(`[Agenda] ${message}`, data ?? '');
  }
}
