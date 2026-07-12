import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import {
  CreateServiceRequest,
  SalonService,
  ServiceService,
  UpdateServiceRequest,
} from '../../core/services/service.service';
import { readImageAsDataUrl } from '../../core/utils/image-file.util';
import {
  resolveServiceGenderForService,
  resolveServiceImageUrl,
  serviceGenderLabel,
  ServiceGender,
} from '../../core/utils/service-image.util';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-semibold text-white">Servicos</h2>
          <p class="mt-1 text-sm text-slate-400">
            @if (isAdmin()) {
              Gerencie o catalogo de servicos do salao.
            } @else {
              Catalogo de servicos disponiveis para agendamento.
            }
          </p>
        </div>
        @if (isAdmin()) {
          <button
            type="button"
            (click)="startCreate()"
            class="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-500"
          >
            Novo servico
          </button>
        }
      </div>

      @if (error()) {
        <p class="text-sm text-rose-400">{{ error() }}</p>
      }

      @if (loading()) {
        <p class="text-slate-400">Carregando servicos...</p>
      } @else if (services().length === 0) {
        <section class="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <p class="text-slate-400">Nenhum servico cadastrado.</p>
        </section>
      } @else {
        <div class="hidden overflow-hidden rounded-xl border border-slate-800 bg-slate-900 md:block">
          <table class="w-full text-left text-sm">
            <thead class="border-b border-slate-800 bg-slate-950/50 text-xs uppercase tracking-wider text-slate-400">
              <tr>
                <th class="px-4 py-3">Imagem</th>
                <th class="px-4 py-3">Nome</th>
                <th class="px-4 py-3">Grupo</th>
                <th class="px-4 py-3">Duracao</th>
                <th class="px-4 py-3">Preco</th>
                <th class="px-4 py-3">Status</th>
                @if (isAdmin()) {
                  <th class="px-4 py-3 text-right">Acoes</th>
                }
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800">
              @for (service of services(); track service.publicId) {
                <tr class="text-slate-200">
                  <td class="px-4 py-3">
                    <img
                      [src]="serviceImage(service)"
                      [alt]="service.name"
                      class="h-14 w-20 rounded-lg border border-slate-700 object-cover"
                    />
                  </td>
                  <td class="px-4 py-3">
                    <p class="font-medium text-white">{{ service.name }}</p>
                    @if (service.description) {
                      <p class="mt-0.5 text-xs text-slate-400">{{ service.description }}</p>
                    }
                  </td>
                  <td class="px-4 py-3">
                    <span
                      class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                      [class.bg-sky-500/15]="serviceGender(service) === 'masculino'"
                      [class.text-sky-300]="serviceGender(service) === 'masculino'"
                      [class.bg-fuchsia-500/15]="serviceGender(service) === 'feminino'"
                      [class.text-fuchsia-300]="serviceGender(service) === 'feminino'"
                    >
                      {{ genderLabel(service) }}
                    </span>
                  </td>
                  <td class="px-4 py-3">{{ service.durationMinutes }} min</td>
                  <td class="px-4 py-3">{{ formatPrice(service.price) }}</td>
                  <td class="px-4 py-3">
                    <span
                      class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                      [class]="
                        service.active
                          ? 'bg-emerald-500/15 text-emerald-300'
                          : 'bg-slate-700/50 text-slate-400'
                      "
                    >
                      {{ service.active ? 'Ativo' : 'Inativo' }}
                    </span>
                  </td>
                  @if (isAdmin()) {
                    <td class="px-4 py-3 text-right">
                      <button
                        type="button"
                        (click)="startEdit(service)"
                        class="mr-2 text-violet-400 transition hover:text-violet-300"
                      >
                        Editar
                      </button>
                      @if (service.active) {
                        <button
                          type="button"
                          (click)="deactivate(service)"
                          class="text-rose-400 transition hover:text-rose-300"
                        >
                          Desativar
                        </button>
                      }
                    </td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div class="space-y-2 md:hidden">
          @for (service of services(); track service.publicId) {
            <article class="rounded-xl border border-slate-800 bg-slate-900 p-3">
              <div class="flex gap-3">
                <img
                  [src]="serviceImage(service)"
                  [alt]="service.name"
                  class="h-16 w-20 shrink-0 rounded-lg border border-slate-700 object-cover"
                />
                <div class="min-w-0 flex-1">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <p class="font-medium text-white">{{ service.name }}</p>
                  @if (service.description) {
                    <p class="mt-0.5 line-clamp-2 text-xs text-slate-400">{{ service.description }}</p>
                  }
                </div>
                <span
                  class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium"
                  [class]="
                    service.active
                      ? 'bg-emerald-500/15 text-emerald-300'
                      : 'bg-slate-700/50 text-slate-400'
                  "
                >
                  {{ service.active ? 'Ativo' : 'Inativo' }}
                </span>
              </div>
              <div class="mt-2 flex flex-wrap gap-3 text-xs text-slate-400">
                <span
                  class="rounded-full px-2 py-0.5 font-medium"
                  [class.bg-sky-500/15]="serviceGender(service) === 'masculino'"
                  [class.text-sky-300]="serviceGender(service) === 'masculino'"
                  [class.bg-fuchsia-500/15]="serviceGender(service) === 'feminino'"
                  [class.text-fuchsia-300]="serviceGender(service) === 'feminino'"
                >
                  {{ genderLabel(service) }}
                </span>
                <span>{{ service.durationMinutes }} min</span>
                <span>{{ formatPrice(service.price) }}</span>
              </div>
              @if (isAdmin()) {
                <div class="mt-2 flex gap-3 text-xs">
                  <button
                    type="button"
                    (click)="startEdit(service)"
                    class="font-medium text-violet-400 transition hover:text-violet-300"
                  >
                    Editar
                  </button>
                  @if (service.active) {
                    <button
                      type="button"
                      (click)="deactivate(service)"
                      class="font-medium text-rose-400 transition hover:text-rose-300"
                    >
                      Desativar
                    </button>
                  }
                </div>
              }
                </div>
              </div>
            </article>
          }
        </div>
      }

      @if (isAdmin() && showForm()) {
        <section class="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h3 class="text-lg font-semibold text-white">
            {{ editingId() ? 'Editar servico' : 'Novo servico' }}
          </h3>

          <form class="mt-6 space-y-4" [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="grid gap-4 sm:grid-cols-2">
              <div class="sm:col-span-2">
                <label for="name" class="mb-1 block text-sm text-slate-300">Nome</label>
                <input
                  id="name"
                  type="text"
                  formControlName="name"
                  class="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-violet-500"
                />
              </div>

              <div class="sm:col-span-2">
                <label for="description" class="mb-1 block text-sm text-slate-300">Descricao</label>
                <textarea
                  id="description"
                  formControlName="description"
                  rows="2"
                  class="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-violet-500"
                ></textarea>
              </div>

              <div class="sm:col-span-2">
                <label for="gender" class="mb-1 block text-sm text-slate-300">Grupo</label>
                <select
                  id="gender"
                  formControlName="gender"
                  class="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-violet-500"
                >
                  <option value="feminino">Feminino</option>
                  <option value="masculino">Masculino</option>
                </select>
                <p class="mt-1 text-xs text-slate-500">
                  Define em qual aba o servico aparece na pagina publica de agendamento.
                </p>
              </div>

              <div class="sm:col-span-2">
                <label class="mb-1 block text-sm text-slate-300">Imagem do servico</label>
                <div class="flex flex-wrap items-center gap-4">
                  @if (imagePreview()) {
                    <img
                      [src]="imagePreview()"
                      alt="Imagem do servico"
                      class="h-20 w-32 rounded-xl border border-slate-700 object-cover"
                    />
                  }
                  <label
                    class="cursor-pointer rounded-xl border border-dashed border-slate-600 px-4 py-3 text-sm text-slate-300 transition hover:border-violet-500 hover:text-white"
                  >
                    Escolher da galeria ou documentos
                    <input
                      type="file"
                      accept="image/*"
                      class="hidden"
                      (change)="onImageSelected($event)"
                    />
                  </label>
                  @if (imagePreview()) {
                    <button
                      type="button"
                      (click)="clearImage()"
                      class="text-sm text-rose-400 transition hover:text-rose-300"
                    >
                      Remover imagem
                    </button>
                  }
                </div>
                @if (imageUploadError()) {
                  <p class="mt-2 text-sm text-rose-400">{{ imageUploadError() }}</p>
                }
                <p class="mt-2 text-xs text-slate-500">
                  Se nao escolher, usamos uma ilustracao padrao na pagina publica.
                </p>
              </div>

              <div>
                <label for="durationMinutes" class="mb-1 block text-sm text-slate-300"
                  >Duracao (min)</label
                >
                <input
                  id="durationMinutes"
                  type="number"
                  min="1"
                  formControlName="durationMinutes"
                  class="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label for="price" class="mb-1 block text-sm text-slate-300">Preco (R$)</label>
                <input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  formControlName="price"
                  class="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-violet-500"
                />
              </div>

              @if (editingId()) {
                <div class="flex items-center gap-2 sm:col-span-2">
                  <input
                    id="active"
                    type="checkbox"
                    formControlName="active"
                    class="rounded border-slate-700 bg-slate-950 text-violet-600 focus:ring-violet-500"
                  />
                  <label for="active" class="text-sm text-slate-300">Servico ativo</label>
                </div>
              }
            </div>

            @if (formError()) {
              <p class="text-sm text-rose-400">{{ formError() }}</p>
            }

            <div class="flex gap-3">
              <button
                type="submit"
                [disabled]="form.invalid || saving()"
                class="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {{ saving() ? 'Salvando...' : 'Salvar' }}
              </button>
              <button
                type="button"
                (click)="cancelForm()"
                class="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
              >
                Cancelar
              </button>
            </div>
          </form>
        </section>
      }
    </div>
  `,
})
export class ServicesComponent {
  private readonly serviceApi = inject(ServiceService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  protected readonly services = signal<SalonService[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly showForm = signal(false);
  protected readonly editingId = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly formError = signal<string | null>(null);
  protected readonly imagePreview = signal<string | null>(null);
  protected readonly imageUploadError = signal<string | null>(null);
  protected readonly isAdmin = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
    description: [''],
    durationMinutes: [30, [Validators.required, Validators.min(1)]],
    price: [0, [Validators.required, Validators.min(0)]],
    active: [true],
    imageUrl: [''],
    gender: ['feminino' as ServiceGender, Validators.required],
  });

  constructor() {
    this.auth.getMe().subscribe({
      next: (profile) => this.isAdmin.set(profile.role === 'ADMIN'),
      error: () => this.error.set('Nao foi possivel carregar o perfil.'),
    });
    this.loadServices();
  }

  protected formatPrice(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  protected serviceImage(service: SalonService): string {
    return resolveServiceImageUrl(service.name, service.description ?? undefined, service.imageUrl);
  }

  protected serviceGender(service: SalonService): ServiceGender {
    return resolveServiceGenderForService(
      service.name,
      service.description ?? undefined,
      service.gender
    );
  }

  protected genderLabel(service: SalonService): string {
    return serviceGenderLabel(this.serviceGender(service));
  }

  protected startCreate(): void {
    this.editingId.set(null);
    this.form.reset({
      name: '',
      description: '',
      durationMinutes: 30,
      price: 0,
      active: true,
      imageUrl: '',
      gender: 'feminino',
    });
    this.imagePreview.set(null);
    this.imageUploadError.set(null);
    this.formError.set(null);
    this.showForm.set(true);
  }

  protected startEdit(service: SalonService): void {
    this.editingId.set(service.publicId);
    this.form.reset({
      name: service.name,
      description: service.description ?? '',
      durationMinutes: service.durationMinutes,
      price: service.price,
      active: service.active,
      imageUrl: service.imageUrl ?? '',
      gender: this.serviceGender(service),
    });
    this.imagePreview.set(service.imageUrl ?? null);
    this.imageUploadError.set(null);
    this.formError.set(null);
    this.showForm.set(true);
  }

  protected cancelForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
    this.formError.set(null);
    this.imagePreview.set(null);
    this.imageUploadError.set(null);
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

  protected onSubmit(): void {
    if (this.form.invalid || this.saving()) {
      return;
    }

    this.saving.set(true);
    this.formError.set(null);

    const raw = this.form.getRawValue();
    const editingId = this.editingId();

    if (editingId) {
      const request: UpdateServiceRequest = {
        name: raw.name,
        description: raw.description || undefined,
        durationMinutes: raw.durationMinutes,
        price: raw.price,
        active: raw.active,
        imageUrl: raw.imageUrl || undefined,
        gender: raw.gender,
      };

      this.serviceApi.update(editingId, request).subscribe({
        next: () => {
          this.saving.set(false);
          this.cancelForm();
          this.loadServices();
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
        this.cancelForm();
        this.loadServices();
      },
      error: () => {
        this.formError.set('Nao foi possivel criar o servico.');
        this.saving.set(false);
      },
    });
  }

  protected deactivate(service: SalonService): void {
    if (!confirm(`Desativar o servico "${service.name}"?`)) {
      return;
    }

    this.serviceApi.delete(service.publicId).subscribe({
      next: () => this.loadServices(),
      error: () => this.error.set('Nao foi possivel desativar o servico.'),
    });
  }

  private loadServices(): void {
    this.loading.set(true);
    this.error.set(null);

    this.serviceApi.list().subscribe({
      next: (items) => {
        this.services.set(items);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Nao foi possivel carregar os servicos.');
        this.loading.set(false);
      },
    });
  }
}
