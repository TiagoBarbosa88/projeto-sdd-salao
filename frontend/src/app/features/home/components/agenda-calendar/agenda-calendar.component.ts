import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Appointment } from '../../../../core/services/appointment.service';
import {
  AgendaViewMode,
  startOfDay,
  startOfWeek,
  toDateInputValue,
} from '../../../../core/utils/agenda-date.util';

type CalendarDay = {
  date: Date;
  key: string;
  inMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  appointmentCount: number;
};

export type PeriodSummary = {
  inPeriod: number;
  outOfPeriod: number;
  total: number;
};

@Component({
  selector: 'app-agenda-calendar',
  standalone: true,
  templateUrl: './agenda-calendar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgendaCalendarComponent {
  readonly referenceDate = input.required<Date>();
  readonly viewMode = input.required<AgendaViewMode>();
  readonly appointments = input.required<Appointment[]>();
  readonly periodLabel = input.required<string>();
  readonly periodSummary = input.required<PeriodSummary>();

  readonly viewModeChange = output<AgendaViewMode>();
  readonly referenceDateChange = output<Date>();

  protected readonly viewModes: { value: AgendaViewMode; label: string }[] = [
    { value: 'day', label: 'Dia' },
    { value: 'week', label: 'Semana' },
    { value: 'month', label: 'Mes' },
  ];

  protected readonly weekdayLabels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'];

  protected readonly appointmentCountByDay = computed(() => {
    const map = new Map<string, number>();

    for (const appointment of this.appointments()) {
      if (appointment.status === 'CANCELLED') {
        continue;
      }

      const key = toDateInputValue(new Date(appointment.startAt));
      map.set(key, (map.get(key) ?? 0) + 1);
    }

    return map;
  });

  protected readonly calendarMonthLabel = computed(() => {
    const reference = this.referenceDate();
    return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(reference);
  });

  protected readonly calendarDays = computed(() => {
    const reference = this.referenceDate();
    const year = reference.getFullYear();
    const month = reference.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const gridStart = startOfWeek(firstOfMonth);
    const selectedKey = toDateInputValue(reference);
    const todayKey = toDateInputValue(new Date());
    const counts = this.appointmentCountByDay();
    const days: CalendarDay[] = [];

    for (let index = 0; index < 42; index++) {
      const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index);
      const key = toDateInputValue(date);

      days.push({
        date,
        key,
        inMonth: date.getMonth() === month,
        isToday: key === todayKey,
        isSelected: key === selectedKey,
        appointmentCount: counts.get(key) ?? 0,
      });
    }

    return days;
  });

  protected setViewMode(mode: AgendaViewMode): void {
    this.viewModeChange.emit(mode);
  }

  protected shiftCalendarMonth(direction: -1 | 1): void {
    const current = this.referenceDate();
    const next = new Date(current.getFullYear(), current.getMonth() + direction, 1);
    const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
    next.setDate(Math.min(current.getDate(), lastDay));
    this.referenceDateChange.emit(startOfDay(next));
  }

  protected selectCalendarDay(date: Date): void {
    this.referenceDateChange.emit(startOfDay(date));
    this.viewModeChange.emit('day');
  }

  protected shiftPeriod(direction: -1 | 1): void {
    const current = this.referenceDate();
    const next = new Date(current);

    switch (this.viewMode()) {
      case 'day':
        next.setDate(next.getDate() + direction);
        break;
      case 'week':
        next.setDate(next.getDate() + direction * 7);
        break;
      case 'month':
        next.setMonth(next.getMonth() + direction);
        break;
    }

    this.referenceDateChange.emit(startOfDay(next));
  }

  protected goToToday(): void {
    this.referenceDateChange.emit(startOfDay(new Date()));
    this.viewModeChange.emit('day');
  }

  protected goToTomorrow(): void {
    const tomorrow = startOfDay(new Date());
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.referenceDateChange.emit(tomorrow);
    this.viewModeChange.emit('day');
  }

  protected calendarDayClass(day: CalendarDay): string {
    const classes = ['border', 'border-transparent'];

    if (!day.inMonth) {
      classes.push('text-slate-600', 'opacity-40');
    } else if (day.isSelected) {
      classes.push('bg-violet-600', 'text-white', 'shadow-md', 'shadow-violet-900/40');
    } else if (day.isToday) {
      classes.push('bg-slate-800', 'text-white', 'ring-2', 'ring-violet-400/50');
    } else if (day.appointmentCount > 0) {
      classes.push('bg-violet-500/15', 'text-violet-200', 'hover:bg-violet-500/25');
    } else if (this.isPastDay(day.date)) {
      classes.push('text-slate-500', 'opacity-60');
    } else {
      classes.push('text-slate-300', 'hover:bg-emerald-500/10', 'hover:text-emerald-200');
    }

    return classes.join(' ');
  }

  protected calendarDayAriaLabel(day: CalendarDay): string {
    const dateLabel = new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(day.date);

    if (day.appointmentCount > 0) {
      return `${dateLabel}, ${day.appointmentCount} agendamento(s)`;
    }

    if (this.isPastDay(day.date)) {
      return `${dateLabel}, dia passado`;
    }

    return `${dateLabel}, dia livre`;
  }

  protected isPastDay(date: Date): boolean {
    return startOfDay(date).getTime() < startOfDay(new Date()).getTime();
  }
}
