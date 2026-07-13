import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import {
  Appointment,
  AppointmentStatus,
} from '../../../../core/services/appointment.service';
import { AgendaViewMode } from '../../../../core/utils/agenda-date.util';
import { appointmentClientLabel } from '../../../../core/utils/team.util';

@Component({
  selector: 'app-appointment-list',
  standalone: true,
  templateUrl: './appointment-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppointmentListComponent {
  readonly loading = input(false);
  readonly hasAppointments = input(false);
  readonly filteredAppointments = input.required<Appointment[]>();
  readonly outOfPeriodAppointments = input.required<Appointment[]>();
  readonly sameDayDifferentYearCount = input(0);
  readonly isClient = input(false);
  readonly periodLabel = input('');
  readonly viewMode = input.required<AgendaViewMode>();
  readonly cancellingId = input<string | null>(null);
  readonly currentRole = input<string | null>(null);
  readonly currentUserPublicId = input<string | null>(null);

  readonly requestNew = output<void>();
  readonly cancelRequested = output<Appointment>();
  readonly goToDate = output<string>();

  protected readonly layoutClass = computed(() => {
    if (this.viewMode() === 'day') {
      return 'flex flex-col gap-2';
    }
    return 'grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
  });

  protected clientLabel(appointment: Appointment): string {
    return appointmentClientLabel(appointment);
  }

  protected formatPeriodYear(value: string): string {
    return String(new Date(value).getFullYear());
  }

  protected formatDateTime(value: string): string {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(value));
  }

  protected formatTime(value: string): string {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  }

  protected statusLabel(status: AppointmentStatus): string {
    const labels: Record<AppointmentStatus, string> = {
      SCHEDULED: 'Agendado',
      CONFIRMED: 'Confirmado',
      CANCELLED: 'Cancelado',
      COMPLETED: 'Concluido',
    };
    return labels[status];
  }

  protected statusClass(status: AppointmentStatus): string {
    const classes: Record<AppointmentStatus, string> = {
      SCHEDULED: 'bg-amber-500/15 text-amber-300',
      CONFIRMED: 'bg-emerald-500/15 text-emerald-300',
      CANCELLED: 'bg-slate-700/50 text-slate-400',
      COMPLETED: 'bg-violet-500/15 text-violet-300',
    };
    return classes[status];
  }

  protected statusAccentClass(status: AppointmentStatus): string {
    const classes: Record<AppointmentStatus, string> = {
      SCHEDULED: 'bg-amber-400',
      CONFIRMED: 'bg-emerald-400',
      CANCELLED: 'bg-slate-600',
      COMPLETED: 'bg-violet-400',
    };
    return classes[status];
  }

  protected canCancel(appointment: Appointment): boolean {
    if (appointment.status === 'CANCELLED' || appointment.status === 'COMPLETED') {
      return false;
    }

    const role = this.currentRole();
    if (role === 'ADMIN' || role === 'PROFESSIONAL') {
      return true;
    }

    if (role === 'CLIENT') {
      return appointment.client?.publicId === this.currentUserPublicId();
    }

    return false;
  }
}
