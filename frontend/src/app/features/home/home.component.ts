import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { SalonService, ServiceService } from '../../core/services/service.service';
import {
  Appointment,
  AppointmentService,
  AppointmentStatus,
} from '../../core/services/appointment.service';
import { TeamMember, TeamService } from '../../core/services/team.service';

type AgendaViewMode = 'day' | 'week' | 'month';

type CalendarDay = {
  date: Date;
  key: string;
  inMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  appointmentCount: number;
};

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="space-y-6">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 class="text-xl font-semibold text-white">Agenda</h2>
          <p class="mt-1 text-sm text-slate-400">
            @if (isClient()) {
              Veja seus horarios e agende quando quiser.
            } @else {
              Consulte e crie agendamentos.
            }
          </p>
        </div>
        <button
          type="button"
          (click)="toggleForm()"
          class="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-900/30 transition hover:bg-violet-500"
        >
          {{ showForm() ? 'Fechar formulario' : 'Novo agendamento' }}
        </button>
      </div>

      @if (error()) {
        <p class="text-sm text-rose-400">{{ error() }}</p>
      }

      @if (showForm()) {
        <section class="rounded-2xl border border-slate-800 bg-slate-900 p-6">
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
                  [min]="startAtInputMin()"
                  [max]="startAtInputMax()"
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

      <div class="space-y-4">
        <section class="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <div class="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p class="mb-2 text-xs uppercase tracking-wider text-slate-400">Visualizacao</p>
              <div class="inline-flex rounded-xl border border-slate-700 bg-slate-950 p-1">
                @for (mode of viewModes; track mode.value) {
                  <button
                    type="button"
                    (click)="setViewMode(mode.value)"
                    class="rounded-lg px-3 py-1.5 text-sm font-medium transition"
                    [class]="
                      viewMode() === mode.value
                        ? 'bg-violet-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    "
                  >
                    {{ mode.label }}
                  </button>
                }
              </div>
            </div>

            <div class="flex flex-wrap gap-2">
              <button
                type="button"
                (click)="shiftPeriod(-1)"
                class="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:border-violet-500 hover:text-white"
                aria-label="Periodo anterior"
              >
                &lt;
              </button>
              <button
                type="button"
                (click)="goToToday()"
                class="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:border-violet-500 hover:text-white"
              >
                Hoje
              </button>
              <button
                type="button"
                (click)="goToTomorrow()"
                class="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:border-violet-500 hover:text-white"
              >
                Amanha
              </button>
              <button
                type="button"
                (click)="shiftPeriod(1)"
                class="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:border-violet-500 hover:text-white"
                aria-label="Proximo periodo"
              >
                &gt;
              </button>
            </div>
          </div>

          <div
            class="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2.5"
          >
            <div>
              <p class="text-[10px] uppercase tracking-wider text-slate-500">Periodo selecionado</p>
              <p class="text-sm font-medium text-violet-300">{{ periodLabel() }}</p>
            </div>
            <div class="text-right">
              <p class="text-lg font-semibold text-white">{{ periodSummary().inPeriod }}</p>
              <p class="text-[10px] text-slate-500">
                {{ periodSummary().inPeriod === 1 ? 'agendamento' : 'agendamentos' }}
                @if (periodSummary().outOfPeriod > 0) {
                  <span class="text-amber-400/80">
                    · {{ periodSummary().outOfPeriod }} fora
                  </span>
                }
              </p>
            </div>
          </div>
        </section>

        <section class="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <h3 class="text-sm font-semibold capitalize text-white">{{ calendarMonthLabel() }}</h3>
            <div class="flex gap-1">
              <button
                type="button"
                (click)="shiftCalendarMonth(-1)"
                class="rounded-lg border border-slate-700 px-2 py-1 text-xs text-slate-300 transition hover:border-violet-500 hover:text-white"
                aria-label="Mes anterior"
              >
                &lt;
              </button>
              <button
                type="button"
                (click)="shiftCalendarMonth(1)"
                class="rounded-lg border border-slate-700 px-2 py-1 text-xs text-slate-300 transition hover:border-violet-500 hover:text-white"
                aria-label="Proximo mes"
              >
                &gt;
              </button>
            </div>
          </div>

          <div
            class="mt-3 grid grid-cols-7 gap-1 text-center text-[10px] font-medium uppercase tracking-wider text-slate-500"
          >
            @for (label of weekdayLabels; track label) {
              <span class="py-0.5">{{ label }}</span>
            }
          </div>

          <div class="mt-1 grid grid-cols-7 gap-1">
            @for (day of calendarDays(); track day.key) {
              <button
                type="button"
                (click)="selectCalendarDay(day.date)"
                class="relative flex h-9 flex-col items-center justify-center rounded-lg text-xs transition sm:h-10"
                [class]="calendarDayClass(day)"
                [attr.aria-label]="calendarDayAriaLabel(day)"
              >
                <span class="font-medium leading-none">{{ day.date.getDate() }}</span>
                @if (day.appointmentCount > 0) {
                  <span
                    class="mt-0.5 h-1 w-1 rounded-full"
                    [class]="day.isSelected ? 'bg-white' : 'bg-violet-400'"
                  ></span>
                } @else if (day.inMonth && !isPastDay(day.date)) {
                  <span class="mt-0.5 h-1 w-1 rounded-full bg-emerald-500/30"></span>
                }
              </button>
            }
          </div>

          <div
            class="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-slate-800 pt-3 text-[10px] text-slate-400"
          >
            <div class="flex items-center gap-1.5">
              <span class="h-1.5 w-1.5 rounded-full bg-violet-400"></span>
              <span>Ocupado</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span class="h-1.5 w-1.5 rounded-full bg-emerald-500/40"></span>
              <span>Livre</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span class="h-3 w-3 rounded ring-2 ring-violet-400/60"></span>
              <span>Hoje</span>
            </div>
          </div>
        </section>

        @if (loading()) {
            <div class="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
              <p class="text-slate-400">Carregando agendamentos...</p>
            </div>
          } @else if (appointments().length === 0) {
            <section
              class="flex flex-col items-center rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 px-6 py-12 text-center"
            >
              <div class="rounded-2xl bg-violet-500/10 p-4">
                <svg class="h-8 w-8 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.5"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 class="mt-4 text-lg font-semibold text-white">Nenhum agendamento ainda</h3>
              <p class="mt-2 max-w-sm text-sm text-slate-400">
                @if (isClient()) {
                  Escolha um dia livre no calendario e agende seu proximo horario.
                } @else {
                  Crie o primeiro agendamento para comecar a usar a agenda.
                }
              </p>
              <button
                type="button"
                (click)="toggleForm()"
                class="mt-6 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-violet-500"
              >
                Novo agendamento
              </button>
            </section>
          } @else if (filteredAppointments().length === 0) {
            <section
              class="flex flex-col items-center rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/20 px-6 py-12 text-center"
            >
              <div class="rounded-2xl bg-emerald-500/10 p-4 ring-1 ring-emerald-500/20">
                <svg class="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.5"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 class="mt-4 text-lg font-semibold text-white">
                @if (isClient()) {
                  Seu dia esta livre
                } @else {
                  Dia livre neste periodo
                }
              </h3>
              <p class="mt-2 max-w-sm text-sm text-slate-400">
                Nenhum agendamento em {{ periodLabel() }}.
                @if (sameDayDifferentYearAppointments().length > 0) {
                  Ha {{ sameDayDifferentYearAppointments().length }} agendamento(s) no mesmo dia e mes em
                  outro ano — veja abaixo.
                } @else {
                  Os dias com ponto roxo no calendario indicam horarios ocupados.
                }
              </p>
              <button
                type="button"
                (click)="toggleForm()"
                class="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-2.5 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/20"
              >
                Agendar neste dia
              </button>

              @if (outOfPeriodAppointments().length > 0) {
                <div class="mt-8 w-full max-w-md rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-left">
                  <p class="text-xs uppercase tracking-wider text-slate-500">Outros agendamentos</p>
                  <ul class="mt-3 space-y-2">
                    @for (appointment of outOfPeriodAppointments(); track appointment.publicId) {
                      <li>
                        <button
                          type="button"
                          (click)="goToAppointmentDate(appointment.startAt)"
                          class="flex w-full flex-col items-start gap-0.5 rounded-lg border border-slate-800 px-3 py-2 text-left text-sm transition hover:border-violet-500/40 hover:bg-slate-900 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <span class="text-slate-300">{{ formatDateTime(appointment.startAt) }}</span>
                          <span class="text-xs text-violet-400">Ir para {{ formatPeriodYear(appointment.startAt) }} &rarr;</span>
                        </button>
                      </li>
                    }
                  </ul>
                </div>
              }
            </section>
          } @else {
            <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              @for (appointment of filteredAppointments(); track appointment.publicId) {
                <article
                  class="group relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/80 p-3 transition hover:border-violet-500/30"
                >
                  <div
                    class="absolute inset-y-0 left-0 w-0.5"
                    [class]="statusAccentClass(appointment.status)"
                  ></div>

                  <div class="pl-2">
                    <div class="flex items-start justify-between gap-2">
                      <div class="min-w-0">
                        <p class="text-sm font-semibold text-white">
                          {{ formatTime(appointment.startAt) }}
                          <span class="font-normal text-slate-500">–</span>
                          {{ formatTime(appointment.endAt) }}
                        </p>
                        <p class="mt-0.5 truncate text-sm text-violet-200">
                          {{ appointment.service.name }}
                        </p>
                      </div>
                      <span
                        class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium"
                        [class]="statusClass(appointment.status)"
                      >
                        {{ statusLabel(appointment.status) }}
                      </span>
                    </div>

                    <p class="mt-2 truncate text-xs text-slate-500">
                      {{ appointment.professional.name }}
                      @if (!isClient()) {
                        <span class="text-slate-600"> · </span>
                        {{ appointment.client.name }}
                      }
                    </p>

                    @if (canCancel(appointment)) {
                      <button
                        type="button"
                        (click)="cancel(appointment)"
                        [disabled]="cancellingId() === appointment.publicId"
                        class="mt-2 text-[11px] font-medium text-rose-400 transition hover:text-rose-300 disabled:opacity-50"
                      >
                        {{ cancellingId() === appointment.publicId ? 'Cancelando...' : 'Cancelar' }}
                      </button>
                    }
                  </div>
                </article>
              }
            </div>
          }
      </div>
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
  protected readonly viewMode = signal<AgendaViewMode>('day');
  protected readonly referenceDate = signal(this.startOfDay(new Date()));

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

      const key = this.toDateInputValue(new Date(appointment.startAt));
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
    const gridStart = this.startOfWeek(firstOfMonth);
    const selectedKey = this.toDateInputValue(reference);
    const todayKey = this.toDateInputValue(new Date());
    const counts = this.appointmentCountByDay();
    const days: CalendarDay[] = [];

    for (let index = 0; index < 42; index++) {
      const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index);
      const key = this.toDateInputValue(date);

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

  protected readonly filteredAppointments = computed(() => {
    const reference = this.referenceDate();
    const mode = this.viewMode();
    const { start, end } = this.getPeriodRange(reference, mode);
    const items = this.appointments();
    const filtered = items
      .filter((item) => this.isWithinPeriod(item.startAt, start, end))
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

    this.debugAgenda('Filtro aplicado', {
      viewMode: mode,
      reference: this.toDateInputValue(reference),
      periodStart: start.toISOString(),
      periodEnd: end.toISOString(),
      total: items.length,
      matched: filtered.length,
      appointments: items.map((item) => ({
        startAt: item.startAt,
        localDay: this.toDateInputValue(new Date(item.startAt)),
        inPeriod: this.isWithinPeriod(item.startAt, start, end),
      })),
    });

    return filtered;
  });

  protected readonly outOfPeriodAppointments = computed(() => {
    const { start, end } = this.getPeriodRange(this.referenceDate(), this.viewMode());
    return this.appointments()
      .filter((item) => !this.isWithinPeriod(item.startAt, start, end))
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  });

  protected readonly periodSummary = computed(() => {
    const inPeriod = this.filteredAppointments().length;
    const total = this.appointments().length;
    return {
      inPeriod,
      outOfPeriod: total - inPeriod,
      total,
    };
  });

  protected readonly sameDayDifferentYearAppointments = computed(() => {
    const reference = this.referenceDate();
    const month = reference.getMonth();
    const day = reference.getDate();
    const year = reference.getFullYear();

    return this.appointments().filter((item) => {
      const date = new Date(item.startAt);
      return date.getMonth() === month && date.getDate() === day && date.getFullYear() !== year;
    });
  });

  protected readonly startAtInputMin = computed(() => {
    const year = this.referenceDate().getFullYear();
    return `${year}-01-01T00:00`;
  });

  protected readonly startAtInputMax = computed(() => {
    const year = this.referenceDate().getFullYear();
    return `${year}-12-31T23:59`;
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
    const opening = !this.showForm();
    this.showForm.set(opening);
    this.formError.set(null);

    if (opening) {
      this.form.controls.startAt.setValue(this.defaultStartAtLocal());
    }
  }

  protected setViewMode(mode: AgendaViewMode): void {
    this.viewMode.set(mode);
  }

  protected shiftCalendarMonth(direction: -1 | 1): void {
    const current = this.referenceDate();
    const next = new Date(current.getFullYear(), current.getMonth() + direction, 1);
    const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
    next.setDate(Math.min(current.getDate(), lastDay));
    this.referenceDate.set(this.startOfDay(next));
  }

  protected selectCalendarDay(date: Date): void {
    this.referenceDate.set(this.startOfDay(date));
    this.viewMode.set('day');
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
    return this.startOfDay(date).getTime() < this.startOfDay(new Date()).getTime();
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
    this.viewMode.set('day');
  }

  protected goToTomorrow(): void {
    const tomorrow = this.startOfDay(new Date());
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.referenceDate.set(tomorrow);
    this.viewMode.set('day');
  }

  protected goToAppointmentDate(isoDate: string): void {
    const date = new Date(isoDate);
    this.referenceDate.set(
      this.startOfDay(new Date(date.getFullYear(), date.getMonth(), date.getDate())),
    );
    this.viewMode.set('day');
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

  protected formatDateShort(value: string): string {
    return new Intl.DateTimeFormat('pt-BR', {
      day: 'numeric',
      month: 'short',
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
        this.goToAppointmentDate(startAt);
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
        this.debugAgenda('Agendamentos carregados', items);
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

  private isWithinPeriod(isoDate: string, periodStart: Date, periodEnd: Date): boolean {
    const startAt = new Date(isoDate).getTime();
    return startAt >= periodStart.getTime() && startAt <= periodEnd.getTime();
  }

  private defaultStartAtLocal(): string {
    const reference = this.referenceDate();
    const candidate = new Date(
      reference.getFullYear(),
      reference.getMonth(),
      reference.getDate(),
      9,
      0,
      0,
    );
    const now = new Date();

    if (candidate.getTime() <= now.getTime()) {
      const nextDay = new Date(reference);
      nextDay.setDate(nextDay.getDate() + 1);
      nextDay.setHours(9, 0, 0, 0);
      return this.toDateTimeLocalValue(nextDay);
    }

    return this.toDateTimeLocalValue(candidate);
  }

  private toDateTimeLocalValue(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hour}:${minute}`;
  }

  private debugAgenda(message: string, data?: unknown): void {
    console.debug(`[Agenda] ${message}`, data ?? '');
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
