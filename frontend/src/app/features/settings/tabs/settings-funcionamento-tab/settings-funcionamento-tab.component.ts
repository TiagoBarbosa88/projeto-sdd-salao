import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SchedulingSettings, SettingsService } from '../../../../core/services/settings.service';
import { SettingsNotification } from '../settings-personalization-tab/settings-personalization-tab.component';

@Component({
  selector: 'app-settings-funcionamento-tab',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './settings-funcionamento-tab.component.html',
})
export class SettingsFuncionamentoTabComponent {
  private readonly fb = inject(FormBuilder);
  private readonly settingsService = inject(SettingsService);

  readonly settings = input<SchedulingSettings | null>(null);
  readonly loading = input(false);

  readonly settingsChange = output<SchedulingSettings>();
  readonly notify = output<SettingsNotification>();

  protected readonly saving = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    zoneId: ['America/Sao_Paulo', Validators.required],
    bufferMinutes: [15, [Validators.required, Validators.min(0)]],
    slotIntervalMinutes: [15, [Validators.required, Validators.min(5)]],
    dayStartTime: ['09:00', Validators.required],
    dayEndTime: ['22:00', Validators.required],
  });

  constructor() {
    effect(() => {
      const scheduling = this.settings();
      if (!scheduling) {
        return;
      }
      this.form.patchValue({
        zoneId: scheduling.zoneId,
        bufferMinutes: scheduling.bufferMinutes,
        slotIntervalMinutes: scheduling.slotIntervalMinutes,
        dayStartTime: scheduling.dayStartTime.slice(0, 5),
        dayEndTime: scheduling.dayEndTime.slice(0, 5),
      });
    });
  }

  protected save(): void {
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);
    this.settingsService.updateSchedulingSettings(this.form.getRawValue()).subscribe({
      next: (settings) => {
        this.saving.set(false);
        this.settingsChange.emit(settings);
        this.notify.emit({ type: 'success', message: 'Regras de agenda atualizadas.' });
      },
      error: () => {
        this.saving.set(false);
        this.notify.emit({ type: 'error', message: 'Nao foi possivel salvar as regras.' });
      },
    });
  }
}
