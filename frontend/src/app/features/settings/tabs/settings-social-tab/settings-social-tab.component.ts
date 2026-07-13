import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { SalonSettings, SettingsService } from '../../../../core/services/settings.service';
import { SettingsNotification } from '../settings-personalization-tab/settings-personalization-tab.component';

@Component({
  selector: 'app-settings-social-tab',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './settings-social-tab.component.html',
})
export class SettingsSocialTabComponent {
  private readonly fb = inject(FormBuilder);
  private readonly settingsService = inject(SettingsService);

  readonly settings = input<SalonSettings | null>(null);
  readonly loading = input(false);

  readonly settingsChange = output<SalonSettings>();
  readonly notify = output<SettingsNotification>();

  protected readonly saving = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    instagramUrl: [''],
    facebookUrl: [''],
    tiktokUrl: [''],
    websiteUrl: [''],
    youtubeUrl: [''],
    googleMapsUrl: [''],
  });

  constructor() {
    effect(() => {
      const salon = this.settings();
      if (!salon) {
        return;
      }
      this.form.patchValue({
        instagramUrl: salon.instagramUrl ?? '',
        facebookUrl: salon.facebookUrl ?? '',
        tiktokUrl: salon.tiktokUrl ?? '',
        websiteUrl: salon.websiteUrl ?? '',
        youtubeUrl: salon.youtubeUrl ?? '',
        googleMapsUrl: salon.googleMapsUrl ?? '',
      });
    });
  }

  protected save(): void {
    if (this.saving()) return;

    const current = this.settings();
    const raw = this.form.getRawValue();
    const payload = {
      name: current?.name ?? '',
      description: current?.description || undefined,
      phone: current?.phone || undefined,
      whatsapp: current?.whatsapp || undefined,
      address: current?.address || undefined,
      logoUrl: current?.logoUrl || undefined,
      instagramUrl: raw.instagramUrl || undefined,
      facebookUrl: raw.facebookUrl || undefined,
      tiktokUrl: raw.tiktokUrl || undefined,
      websiteUrl: raw.websiteUrl || undefined,
      youtubeUrl: raw.youtubeUrl || undefined,
      googleMapsUrl: raw.googleMapsUrl || undefined,
    };

    this.saving.set(true);
    this.settingsService.updateSalonSettings(payload).subscribe({
      next: (settings) => {
        this.saving.set(false);
        this.settingsChange.emit(settings);
        this.notify.emit({ type: 'success', message: 'Redes atualizadas.' });
      },
      error: () => {
        this.saving.set(false);
        this.notify.emit({ type: 'error', message: 'Nao foi possivel salvar as redes.' });
      },
    });
  }
}
