import { Component, effect, inject, input, output, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PhoneMaskDirective } from '../../../../core/directives/phone-mask.directive';
import { SalonSettings, SettingsService } from '../../../../core/services/settings.service';
import { readImageAsDataUrl } from '../../../../core/utils/image-file.util';
import {
  formatPhoneDisplay,
  normalizePhoneValue,
  optionalPhoneValidator,
} from '../../../../core/utils/phone.util';

export type SettingsNotification = { type: 'success' | 'error'; message: string };

@Component({
  selector: 'app-settings-personalization-tab',
  standalone: true,
  imports: [ReactiveFormsModule, PhoneMaskDirective],
  templateUrl: './settings-personalization-tab.component.html',
})
export class SettingsPersonalizationTabComponent {
  private readonly fb = inject(FormBuilder);
  private readonly settingsService = inject(SettingsService);

  readonly settings = input<SalonSettings | null>(null);
  readonly loading = input(false);

  readonly settingsChange = output<SalonSettings>();
  readonly notify = output<SettingsNotification>();

  protected readonly saving = signal(false);
  protected readonly logoPreview = signal<string | null>(null);
  protected readonly logoUploadError = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    description: [''],
    phone: ['', (control: AbstractControl) => optionalPhoneValidator(control.value)],
    whatsapp: ['', (control: AbstractControl) => optionalPhoneValidator(control.value)],
    address: [''],
    logoUrl: [''],
  });

  constructor() {
    effect(() => {
      const salon = this.settings();
      if (!salon) {
        return;
      }
      this.form.patchValue({
        name: salon.name,
        description: salon.description ?? '',
        phone: formatPhoneDisplay(salon.phone),
        whatsapp: formatPhoneDisplay(salon.whatsapp),
        address: salon.address ?? '',
        logoUrl: salon.logoUrl ?? '',
      });
      this.logoPreview.set(salon.logoUrl ?? null);
    });
  }

  protected async onLogoSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    this.logoUploadError.set(null);
    try {
      const dataUrl = await readImageAsDataUrl(file);
      this.form.controls.logoUrl.setValue(dataUrl);
      this.logoPreview.set(dataUrl);
    } catch (error) {
      this.logoUploadError.set(
        error instanceof Error ? error.message : 'Nao foi possivel carregar a imagem.'
      );
    }
  }

  protected save(): void {
    if (this.form.invalid || this.saving()) return;

    const current = this.settings();
    const raw = this.form.getRawValue();
    const payload = {
      name: raw.name,
      description: raw.description || undefined,
      phone: normalizePhoneValue(raw.phone),
      whatsapp: normalizePhoneValue(raw.whatsapp),
      address: raw.address || undefined,
      logoUrl: raw.logoUrl || undefined,
      instagramUrl: current?.instagramUrl || undefined,
      facebookUrl: current?.facebookUrl || undefined,
      tiktokUrl: current?.tiktokUrl || undefined,
      websiteUrl: current?.websiteUrl || undefined,
      youtubeUrl: current?.youtubeUrl || undefined,
      googleMapsUrl: current?.googleMapsUrl || undefined,
    };

    this.saving.set(true);
    this.settingsService.updateSalonSettings(payload).subscribe({
      next: (settings) => {
        this.saving.set(false);
        this.settingsChange.emit(settings);
        this.notify.emit({ type: 'success', message: 'Personalizacao atualizada.' });
      },
      error: () => {
        this.saving.set(false);
        this.notify.emit({ type: 'error', message: 'Nao foi possivel salvar a personalizacao.' });
      },
    });
  }
}
