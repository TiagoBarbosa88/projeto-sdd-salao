import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import {
  BlockedPeriod,
  BlockType,
  ScheduleService,
  WorkingPeriodEntry,
} from '../../../../core/services/schedule.service';
import { Professional } from '../../../../core/services/team.service';
import { SettingsNotification } from '../settings-personalization-tab/settings-personalization-tab.component';

const WEEKDAYS: { value: number; label: string }[] = [
  { value: 1, label: 'Segunda' },
  { value: 2, label: 'Terca' },
  { value: 3, label: 'Quarta' },
  { value: 4, label: 'Quinta' },
  { value: 5, label: 'Sexta' },
  { value: 6, label: 'Sabado' },
  { value: 7, label: 'Domingo' },
];

type DayScheduleRow = {
  dayOfWeek: number;
  label: string;
  enabled: boolean;
  startTime: string;
  endTime: string;
  lunchEnabled: boolean;
  lunchStart: string;
  lunchEnd: string;
};

@Component({
  selector: 'app-settings-agenda-tab',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './settings-agenda-tab.component.html',
})
export class SettingsAgendaTabComponent {
  private readonly fb = inject(FormBuilder);
  private readonly scheduleService = inject(ScheduleService);

  readonly professionals = input.required<Professional[]>();
  readonly canManageAll = input(false);
  /** Profissional pre-selecionado (proprio usuario para roles sem gestao geral). */
  readonly initialProfessionalId = input<string | null>(null);

  readonly notify = output<SettingsNotification>();

  protected readonly selectedProfessionalId = signal<string | null>(null);
  protected readonly dayRows = signal<DayScheduleRow[]>(this.defaultDayRows());
  protected readonly blockedPeriods = signal<BlockedPeriod[]>([]);
  protected readonly scheduleLoading = signal(false);
  protected readonly scheduleSaving = signal(false);
  protected readonly blockSaving = signal(false);

  protected readonly blockForm = this.fb.nonNullable.group({
    startAt: ['', Validators.required],
    endAt: ['', Validators.required],
    blockType: ['VACATION' as BlockType, Validators.required],
    reason: [''],
  });

  constructor() {
    effect(() => {
      if (this.selectedProfessionalId()) {
        return;
      }

      const initial = this.initialProfessionalId();
      if (initial) {
        this.selectedProfessionalId.set(initial);
        this.loadSchedule(initial);
        return;
      }

      const professionals = this.professionals();
      if (this.canManageAll() && professionals.length > 0) {
        this.selectedProfessionalId.set(professionals[0].publicId);
        this.loadSchedule(professionals[0].publicId);
      }
    });
  }

  protected onProfessionalChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedProfessionalId.set(value || null);
    if (value) {
      this.loadSchedule(value);
    }
  }

  protected toggleDay(dayOfWeek: number, event: Event): void {
    const enabled = (event.target as HTMLInputElement).checked;
    this.dayRows.update((rows) =>
      rows.map((row) => (row.dayOfWeek === dayOfWeek ? { ...row, enabled } : row))
    );
  }

  protected toggleLunch(dayOfWeek: number, event: Event): void {
    const enabled = (event.target as HTMLInputElement).checked;
    this.dayRows.update((rows) =>
      rows.map((row) => (row.dayOfWeek === dayOfWeek ? { ...row, lunchEnabled: enabled } : row))
    );
  }

  protected updateDayTime(
    dayOfWeek: number,
    field: 'startTime' | 'endTime' | 'lunchStart' | 'lunchEnd',
    event: Event
  ): void {
    const value = (event.target as HTMLInputElement).value;
    this.dayRows.update((rows) =>
      rows.map((row) => (row.dayOfWeek === dayOfWeek ? { ...row, [field]: value } : row))
    );
  }

  protected saveWorkingHours(): void {
    const memberId = this.selectedProfessionalId();
    if (!memberId || this.scheduleSaving()) return;

    const periods: WorkingPeriodEntry[] = [];
    for (const row of this.dayRows()) {
      if (!row.enabled) {
        continue;
      }
      if (row.lunchEnabled && row.lunchStart && row.lunchEnd && row.lunchStart < row.lunchEnd) {
        periods.push({
          dayOfWeek: row.dayOfWeek,
          startTime: row.startTime,
          endTime: row.lunchStart,
        });
        periods.push({
          dayOfWeek: row.dayOfWeek,
          startTime: row.lunchEnd,
          endTime: row.endTime,
        });
      } else {
        periods.push({
          dayOfWeek: row.dayOfWeek,
          startTime: row.startTime,
          endTime: row.endTime,
        });
      }
    }

    this.scheduleSaving.set(true);
    this.scheduleService.updateWorkingHours(memberId, periods).subscribe({
      next: () => {
        this.scheduleSaving.set(false);
        this.notify.emit({ type: 'success', message: 'Horarios salvos.' });
      },
      error: () => {
        this.scheduleSaving.set(false);
        this.notify.emit({ type: 'error', message: 'Nao foi possivel salvar os horarios.' });
      },
    });
  }

  protected createBlock(): void {
    const memberId = this.selectedProfessionalId();
    if (!memberId || this.blockForm.invalid || this.blockSaving()) return;

    const raw = this.blockForm.getRawValue();
    this.blockSaving.set(true);
    this.scheduleService
      .createBlockedPeriod(memberId, {
        startAt: this.toOffsetDateTime(raw.startAt),
        endAt: this.toOffsetDateTime(raw.endAt),
        reason: raw.reason || undefined,
        blockType: raw.blockType,
      })
      .subscribe({
        next: () => {
          this.blockSaving.set(false);
          this.blockForm.reset({ blockType: 'VACATION' });
          this.loadSchedule(memberId);
          this.notify.emit({ type: 'success', message: 'Bloqueio adicionado.' });
        },
        error: () => {
          this.blockSaving.set(false);
          this.notify.emit({ type: 'error', message: 'Nao foi possivel adicionar o bloqueio.' });
        },
      });
  }

  protected removeBlock(block: BlockedPeriod): void {
    const memberId = this.selectedProfessionalId();
    if (!memberId) return;
    this.scheduleService.deleteBlockedPeriod(memberId, block.publicId).subscribe({
      next: () => {
        this.loadSchedule(memberId);
        this.notify.emit({ type: 'success', message: 'Bloqueio removido.' });
      },
      error: () => this.notify.emit({ type: 'error', message: 'Nao foi possivel remover o bloqueio.' }),
    });
  }

  protected blockTypeLabel(type: BlockType): string {
    switch (type) {
      case 'VACATION':
        return 'Ferias';
      case 'BREAK':
        return 'Pausa';
      default:
        return 'Bloqueio';
    }
  }

  protected formatBlockRange(block: BlockedPeriod): string {
    return `${this.formatDateTime(block.startAt)} — ${this.formatDateTime(block.endAt)}`;
  }

  private loadSchedule(memberPublicId: string): void {
    this.scheduleLoading.set(true);
    forkJoin({
      working: this.scheduleService.getWorkingHours(memberPublicId),
      blocks: this.scheduleService.listBlockedPeriods(memberPublicId),
    }).subscribe({
      next: ({ working, blocks }) => {
        this.blockedPeriods.set(blocks);
        this.dayRows.set(this.mergeWorkingHours(working));
        this.scheduleLoading.set(false);
      },
      error: () => {
        this.scheduleLoading.set(false);
        this.notify.emit({ type: 'error', message: 'Nao foi possivel carregar a agenda.' });
      },
    });
  }

  private mergeWorkingHours(periods: { dayOfWeek: number; startTime: string; endTime: string }[]): DayScheduleRow[] {
    return WEEKDAYS.map((day) => {
      const dayPeriods = periods
        .filter((period) => period.dayOfWeek === day.value)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));

      if (dayPeriods.length >= 2) {
        const first = dayPeriods[0];
        const last = dayPeriods[dayPeriods.length - 1];
        return {
          dayOfWeek: day.value,
          label: day.label,
          enabled: true,
          startTime: first.startTime.slice(0, 5),
          endTime: last.endTime.slice(0, 5),
          lunchEnabled: true,
          lunchStart: first.endTime.slice(0, 5),
          lunchEnd: last.startTime.slice(0, 5),
        };
      }

      const match = dayPeriods[0];
      return {
        dayOfWeek: day.value,
        label: day.label,
        enabled: !!match,
        startTime: match?.startTime?.slice(0, 5) ?? '09:00',
        endTime: match?.endTime?.slice(0, 5) ?? '18:00',
        lunchEnabled: false,
        lunchStart: '12:00',
        lunchEnd: '13:00',
      };
    });
  }

  private defaultDayRows(): DayScheduleRow[] {
    return WEEKDAYS.map((day) => ({
      dayOfWeek: day.value,
      label: day.label,
      enabled: day.value <= 5,
      startTime: '09:00',
      endTime: '18:00',
      lunchEnabled: false,
      lunchStart: '12:00',
      lunchEnd: '13:00',
    }));
  }

  private toOffsetDateTime(localValue: string): string {
    return new Date(localValue).toISOString();
  }

  private formatDateTime(value: string): string {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(value));
  }
}
