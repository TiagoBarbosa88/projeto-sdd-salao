import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  CreateServiceRequest,
  SalonService,
  ServiceService,
  UpdateServiceRequest,
} from '../../../../core/services/service.service';
import { readImageAsDataUrl } from '../../../../core/utils/image-file.util';
import { ServiceGender } from '../../../../core/utils/service-image.util';

@Component({
  selector: 'app-service-form-modal',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './service-form-modal.component.html',
})
export class ServiceFormModalComponent implements OnInit {
  private readonly serviceApi = inject(ServiceService);
  private readonly fb = inject(FormBuilder);

  /** Servico em edicao; null para criacao. */
  readonly service = input<SalonService | null>(null);

  readonly saved = output<void>();
  readonly cancelled = output<void>();

  protected readonly saving = signal(false);
  protected readonly formError = signal<string | null>(null);
  protected readonly imagePreview = signal<string | null>(null);
  protected readonly imageUploadError = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
    description: [''],
    durationMinutes: [30, [Validators.required, Validators.min(1)]],
    price: [0, [Validators.required, Validators.min(0)]],
    active: [true],
    imageUrl: [''],
    gender: ['feminino' as ServiceGender, Validators.required],
  });

  protected get isEditing(): boolean {
    return this.service() !== null;
  }

  ngOnInit(): void {
    const service = this.service();
    if (service) {
      this.form.reset({
        name: service.name,
        description: service.description ?? '',
        durationMinutes: service.durationMinutes,
        price: service.price,
        active: service.active,
        imageUrl: service.imageUrl ?? '',
        gender: service.gender ?? 'feminino',
      });
      this.imagePreview.set(service.imageUrl ?? null);
    }
  }

  protected async onImageSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    this.imageUploadError.set(null);
    try {
      const dataUrl = await readImageAsDataUrl(file);
      this.form.controls.imageUrl.setValue(dataUrl);
      this.imagePreview.set(dataUrl);
    } catch (error) {
      this.imageUploadError.set(
        error instanceof Error ? error.message : 'Nao foi possivel carregar a imagem.'
      );
    }
  }

  protected clearImage(): void {
    this.form.controls.imageUrl.setValue('');
    this.imagePreview.set(null);
    this.imageUploadError.set(null);
  }

  protected cancel(): void {
    this.cancelled.emit();
  }

  protected onSubmit(): void {
    if (this.form.invalid || this.saving()) {
      return;
    }

    this.saving.set(true);
    this.formError.set(null);

    const raw = this.form.getRawValue();
    const editing = this.service();

    if (editing) {
      const request: UpdateServiceRequest = {
        name: raw.name,
        description: raw.description || undefined,
        durationMinutes: raw.durationMinutes,
        price: raw.price,
        active: raw.active,
        imageUrl: raw.imageUrl || undefined,
        gender: raw.gender,
      };

      this.serviceApi.update(editing.publicId, request).subscribe({
        next: () => {
          this.saving.set(false);
          this.saved.emit();
        },
        error: () => {
          this.formError.set('Nao foi possivel atualizar o servico.');
          this.saving.set(false);
        },
      });
      return;
    }

    const request: CreateServiceRequest = {
      name: raw.name,
      description: raw.description || undefined,
      durationMinutes: raw.durationMinutes,
      price: raw.price,
      imageUrl: raw.imageUrl || undefined,
      gender: raw.gender,
    };

    this.serviceApi.create(request).subscribe({
      next: () => {
        this.saving.set(false);
        this.saved.emit();
      },
      error: () => {
        this.formError.set('Nao foi possivel criar o servico.');
        this.saving.set(false);
      },
    });
  }
}
