import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { SalonService, ServiceService } from '../../core/services/service.service';
import {
  Appointment,
  AppointmentService,
  AppointmentStatus,
} from '../../core/services/appointment.service';
import { TeamMember, TeamService } from '../../core/services/team.service';

type AgendaViewMode = 'day' | 'week' | 'month';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule],
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

      <section class="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <div class="flex flex-wrap items-end gap-4">
          <div>
            <p class="mb-2 text-xs uppercase tracking-wider text-slate-400">Visualizacao</p>
            <div class="inline-flex rounded-lg border border-slate-700 bg-slate-950 p-1">
              @for (mode of viewModes; track mode.value) {
                <button
                  type="button"
                  (click)="setViewMode(mode.value)"
                  class="rounded-md px-3 py-1.5 text-sm font-medium transition"
                  [class]="
                    viewMode() === mode.value
                      ? 'bg-violet-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  "
                >
                  {{ mode.label }}
                </button>
              }
            </div>
          </div>

          <div class="flex flex-wrap items-end gap-2">
            <button
              type="button"
              (click)="shiftPeriod(-1)"
              class="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:border-violet-500 hover:text-white"
              aria-label="Periodo anterior"
            >
              &lt;
            </button>
            <div>
              <label for="referenceDate" class="mb-1 block text-xs text-slate-400">Referencia</label>
              <input
                id="referenceDate"
                type="date"
                [ngModel]="referenceDateInput()"
                (ngModelChange)="onReferenceDateChange($event)"
                class="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-violet-500"
              />
            </div>
            <button
              type="button"
              (click)="shiftPeriod(1)"
              class="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:border-violet-500 hover:text-white"
              aria-label="Proximo periodo"
            >
              &gt;
            </button>
            <button
              type="button"
              (click)="goToToday()"
              class="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:border-violet-500 hover:text-white"
            >
              Hoje
            </button>
          </div>
        </div>
        <p class="mt-3 text-sm text-slate-400">
          Periodo:
          <span class="font-medium text-violet-300">{{ periodLabel() }}</span>
          <span class="text-slate-500"> · {{ filteredAppointments().length }} agendamento(s)</span>
        </p>
      </section>

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
      } @else if (filteredAppointments().length === 0) {
        <section class="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <p class="text-slate-400">Nenhum agendamento neste periodo.</p>
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
              @for (appointment of filteredAppointments(); track appointment.publicId) {
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
  protected readonly viewMode = signal<AgendaViewMode>('week');
  protected readonly referenceDate = signal(this.startOfDay(new Date()));

  protected readonly viewModes: { value: AgendaViewMode; label: string }[] = [
    { value: 'day', label: 'Dia' },
    { value: 'week', label: 'Semana' },
    { value: 'month', label: 'Mes' },
  ];

  protected readonly filteredAppointments = computed(() => {
    const { start, end } = this.getPeriodRange(this.referenceDate(), this.viewMode());
    return this.appointments()
      .filter((item) => {
        const startAt = new Date(item.startAt).getTime();
        return startAt >= start.getTime() && startAt <= end.getTime();
      })
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  });

  protected readonly periodLabel = computed(() => {
    const { start, end } = this.getPeriodRange(this.referenceDate(), this.viewMode());
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

  protected readonly referenceDateInput = computed(() => this.toDateInputValue(this.referenceDate()));

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

  protected setViewMode(mode: AgendaViewMode): void {
    this.viewMode.set(mode);
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

    this.referenceDate.set(this.startOfDay(next));
  }

  protected goToToday(): void {
    this.referenceDate.set(this.startOfDay(new Date()));
  }

  protected onReferenceDateChange(value: string): void {
    if (!value) {
      return;
    }

    const [year, month, day] = value.split('-').map(Number);
    this.referenceDate.set(this.startOfDay(new Date(year, month - 1, day)));
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

  private getPeriodRange(reference: Date, mode: AgendaViewMode): { start: Date; end: Date } {
    switch (mode) {
      case 'day': {
        const start = this.startOfDay(reference);
        const end = this.endOfDay(reference);
        return { start, end };
      }
      case 'week': {
        const start = this.startOfWeek(reference);
        const end = this.endOfDay(new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6));
        return { start, end };
      }
      case 'month': {
        const start = this.startOfDay(new Date(reference.getFullYear(), reference.getMonth(), 1));
        const end = this.endOfDay(new Date(reference.getFullYear(), reference.getMonth() + 1, 0));
        return { start, end };
      }
    }
  }

  private startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  private endOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
  }

  private startOfWeek(date: Date): Date {
    const start = this.startOfDay(date);
    const day = start.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + diff);
    return start;
  }

  private toDateInputValue(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
