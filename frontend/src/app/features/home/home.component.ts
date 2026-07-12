import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { SalonService, ServiceService } from '../../core/services/service.service';
import {
  Appointment,
  AppointmentService,
  AppointmentStatus,
} from '../../core/services/appointment.service';
import { TeamMember, TeamService } from '../../core/services/team.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-semibold text-white">Agenda</h2>
          <p class="mt-1 text-sm text-slate-400">Consulte e crie agendamentos.</p>
        </div>
        <button
          type="button"
          (click)="toggleForm()"
          class="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-500"
        >
          {{ showForm() ? 'Fechar formulario' : 'Novo agendamento' }}
        </button>
      </div>

      @if (error()) {
        <p class="text-sm text-rose-400">{{ error() }}</p>
      }

      @if (showForm()) {
        <section class="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h3 class="text-lg font-semibold text-white">Novo agendamento</h3>

          <form class="mt-6 space-y-4" [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label for="servicePublicId" class="mb-1 block text-sm text-slate-300">Servico</label>
                <select
                  id="servicePublicId"
                  formControlName="servicePublicId"
                  class="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-violet-500"
                >
                  <option value="">Selecione...</option>
                  @for (service of activeServices(); track service.publicId) {
                    <option [value]="service.publicId">
                      {{ service.name }} ({{ service.durationMinutes }} min)
                    </option>
                  }
                </select>
              </div>

              @if (isClient()) {
                <div>
                  <label for="professionalPublicId" class="mb-1 block text-sm text-slate-300"
                    >Profissional</label
                  >
                  <select
                    id="professionalPublicId"
                    formControlName="professionalPublicId"
                    class="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-violet-500"
                  >
                    <option value="">Selecione...</option>
                    @for (member of professionals(); track member.publicId) {
                      <option [value]="member.publicId">{{ member.name }}</option>
                    }
                  </select>
                </div>
              } @else if (!form.controls.selfAsProfessional.value) {
                <div>
                  <label for="professionalPublicId" class="mb-1 block text-sm text-slate-300"
                    >Profissional</label
                  >
                  <select
                    id="professionalPublicId"
                    formControlName="professionalPublicId"
                    class="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-violet-500"
                  >
                    <option value="">Selecione...</option>
                    @for (member of professionals(); track member.publicId) {
                      <option [value]="member.publicId">{{ member.name }}</option>
                    }
                  </select>
                </div>
              }

              @if (isStaff()) {
                <div class="sm:col-span-2">
                  <label class="flex items-center gap-2 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      formControlName="selfAsProfessional"
                      class="rounded border-slate-700 bg-slate-950 text-violet-600 focus:ring-violet-500"
                    />
                    Eu sou o profissional
                  </label>
                </div>

                @if (form.controls.selfAsProfessional.value && currentUserName()) {
                  <div class="sm:col-span-2 text-sm text-slate-300">
                    Profissional: <span class="text-white">{{ currentUserName() }}</span>
                  </div>
                }

                <div class="sm:col-span-2">
                  <label class="flex items-center gap-2 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      formControlName="bookForSelf"
                      class="rounded border-slate-700 bg-slate-950 text-violet-600 focus:ring-violet-500"
                    />
                    Agendar para mim (cliente)
                  </label>
                </div>

                @if (!form.controls.bookForSelf.value) {
                  <div class="sm:col-span-2">
                    <label for="clientPublicId" class="mb-1 block text-sm text-slate-300">Cliente</label>
                    <select
                      id="clientPublicId"
                      formControlName="clientPublicId"
                      class="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-violet-500"
                    >
                      <option value="">Selecione...</option>
                      @for (member of clients(); track member.publicId) {
                        <option [value]="member.publicId">{{ member.name }}</option>
                      }
                    </select>
                  </div>
                }
              }

              <div class="sm:col-span-2">
                <label for="startAt" class="mb-1 block text-sm text-slate-300">Inicio</label>
                <input
                  id="startAt"
                  type="datetime-local"
                  formControlName="startAt"
                  class="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-violet-500"
                />
              </div>
            </div>

            @if (formError()) {
              <p class="text-sm text-rose-400">{{ formError() }}</p>
            }

            <button
              type="submit"
              [disabled]="!canSubmit() || saving()"
              class="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {{ saving() ? 'Agendando...' : 'Agendar' }}
            </button>
          </form>
        </section>
      }

      @if (loading()) {
        <p class="text-slate-400">Carregando agendamentos...</p>
      } @else if (appointments().length === 0) {
        <section class="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <p class="text-slate-400">Nenhum agendamento encontrado.</p>
        </section>
      } @else {
        <section class="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
          <table class="w-full text-left text-sm">
            <thead class="border-b border-slate-800 bg-slate-950/50 text-xs uppercase tracking-wider text-slate-400">
              <tr>
                <th class="px-4 py-3">Inicio</th>
                <th class="px-4 py-3">Fim</th>
                <th class="px-4 py-3">Servico</th>
                <th class="px-4 py-3">Profissional</th>
                <th class="px-4 py-3">Cliente</th>
                <th class="px-4 py-3">Status</th>
                <th class="px-4 py-3 text-right">Acoes</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800">
              @for (appointment of appointments(); track appointment.publicId) {
                <tr class="text-slate-200">
                  <td class="px-4 py-3">{{ formatDateTime(appointment.startAt) }}</td>
                  <td class="px-4 py-3">{{ formatDateTime(appointment.endAt) }}</td>
                  <td class="px-4 py-3">{{ appointment.service?.name ?? '—' }}</td>
                  <td class="px-4 py-3">{{ appointment.professional?.name ?? '—' }}</td>
                  <td class="px-4 py-3">{{ appointment.client?.name ?? '—' }}</td>
                  <td class="px-4 py-3">
                    <span
                      class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                      [class]="statusClass(appointment.status)"
                    >
                      {{ statusLabel(appointment.status) }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-right">
                    @if (canCancel(appointment)) {
                      <button
                        type="button"
                        (click)="cancel(appointment)"
                        [disabled]="cancellingId() === appointment.publicId"
                        class="text-rose-400 transition hover:text-rose-300 disabled:opacity-50"
                      >
                        {{ cancellingId() === appointment.publicId ? 'Cancelando...' : 'Cancelar' }}
                      </button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </section>
      }
    </div>
  `,
})
export class HomeComponent {
  private readonly appointmentApi = inject(AppointmentService);
  private readonly serviceApi = inject(ServiceService);
  private readonly teamApi = inject(TeamService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  protected readonly appointments = signal<Appointment[]>([]);
  protected readonly activeServices = signal<SalonService[]>([]);
  protected readonly professionals = signal<TeamMember[]>([]);
  protected readonly clients = signal<TeamMember[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly showForm = signal(false);
  protected readonly saving = signal(false);
  protected readonly formError = signal<string | null>(null);
  protected readonly cancellingId = signal<string | null>(null);
  protected readonly isClient = signal(false);
  protected readonly isStaff = signal(false);
  protected readonly currentUserPublicId = signal<string | null>(null);
  protected readonly currentUserName = signal<string | null>(null);
  protected readonly currentRole = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    servicePublicId: ['', Validators.required],
    professionalPublicId: ['', Validators.required],
    selfAsProfessional: [false],
    bookForSelf: [false],
    clientPublicId: [''],
    startAt: ['', Validators.required],
  });

  constructor() {
    this.auth.getMe().subscribe({
      next: (profile) => {
        const isClient = profile.role === 'CLIENT';
        const isStaff = profile.role === 'ADMIN' || profile.role === 'PROFESSIONAL';

        this.isClient.set(isClient);
        this.isStaff.set(isStaff);
        this.currentUserPublicId.set(profile.user.publicId);
        this.currentUserName.set(profile.user.name);
        this.currentRole.set(profile.role);

        if (isClient) {
          this.form.controls.bookForSelf.setValue(true);
        } else if (isStaff) {
          this.form.controls.selfAsProfessional.setValue(true);
          if (profile.role === 'ADMIN') {
            this.form.controls.bookForSelf.setValue(true);
          }
          this.applySelfAsProfessional(true, profile.user.publicId);
        }
      },
      error: () => this.error.set('Nao foi possivel carregar o perfil.'),
    });

    this.form.controls.selfAsProfessional.valueChanges.subscribe((enabled) => {
      this.applySelfAsProfessional(enabled, this.currentUserPublicId());
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
    this.showForm.update((value) => !value);
    this.formError.set(null);
  }

  protected formatDateTime(value: string): string {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
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

  protected canSubmit(): boolean {
    const raw = this.form.getRawValue();

    if (!raw.servicePublicId || !raw.startAt) {
      return false;
    }

    if (this.isClient()) {
      return !!raw.professionalPublicId;
    }

    if (raw.selfAsProfessional) {
      if (!raw.bookForSelf && !raw.clientPublicId) {
        return false;
      }
      return true;
    }

    if (!raw.professionalPublicId) {
      return false;
    }

    if (!raw.bookForSelf && !raw.clientPublicId) {
      return false;
    }

    return true;
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
      return appointment.client.publicId === this.currentUserPublicId();
    }

    return false;
  }

  protected onSubmit(): void {
    if (!this.canSubmit() || this.saving()) {
      return;
    }

    this.saving.set(true);
    this.formError.set(null);

    const raw = this.form.getRawValue();
    const startAt = this.toOffsetDateTime(raw.startAt);
    const professionalPublicId = raw.selfAsProfessional
      ? (this.currentUserPublicId() ?? raw.professionalPublicId)
      : raw.professionalPublicId;

    const request: {
      servicePublicId: string;
      professionalPublicId: string;
      clientPublicId?: string;
      startAt: string;
    } = {
      servicePublicId: raw.servicePublicId,
      professionalPublicId,
      startAt,
    };

    if (!this.isClient()) {
      if (raw.bookForSelf) {
        const userId = this.currentUserPublicId();
        if (userId) {
          request.clientPublicId = userId;
        }
      } else if (raw.clientPublicId) {
        request.clientPublicId = raw.clientPublicId;
      }
    }

    this.appointmentApi.create(request).subscribe({
      next: () => {
        this.saving.set(false);
        this.showForm.set(false);
        this.resetForm();
        this.loadData();
      },
      error: () => {
        this.formError.set('Nao foi possivel criar o agendamento.');
        this.saving.set(false);
      },
    });
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

  private resetForm(): void {
    const isClient = this.isClient();
    const isStaff = this.isStaff();
    const isAdmin = this.currentRole() === 'ADMIN';
    const userId = this.currentUserPublicId();

    this.form.reset({
      servicePublicId: '',
      professionalPublicId: '',
      selfAsProfessional: isStaff,
      bookForSelf: isClient || isAdmin,
      clientPublicId: '',
      startAt: '',
    });

    if (isStaff) {
      this.applySelfAsProfessional(true, userId);
    } else {
      this.applySelfAsProfessional(false, userId);
    }
  }

  private applySelfAsProfessional(enabled: boolean, publicId: string | null): void {
    const control = this.form.controls.professionalPublicId;

    if (enabled && publicId) {
      control.setValue(publicId);
      control.clearValidators();
    } else {
      control.setValidators(Validators.required);
      if (!enabled) {
        control.setValue('');
      }
    }

    control.updateValueAndValidity();
  }

  private loadData(): void {
    this.loading.set(true);
    this.error.set(null);

    this.appointmentApi.list().subscribe({
      next: (items) => {
        this.appointments.set(items);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Nao foi possivel carregar os agendamentos.');
        this.loading.set(false);
      },
    });
  }

  private toOffsetDateTime(localValue: string): string {
    const date = new Date(localValue);
    const offsetMinutes = -date.getTimezoneOffset();
    const sign = offsetMinutes >= 0 ? '+' : '-';
    const absOffset = Math.abs(offsetMinutes);
    const hours = String(Math.floor(absOffset / 60)).padStart(2, '0');
    const minutes = String(absOffset % 60).padStart(2, '0');

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    const second = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day}T${hour}:${minute}:${second}${sign}${hours}:${minutes}`;
  }
}
