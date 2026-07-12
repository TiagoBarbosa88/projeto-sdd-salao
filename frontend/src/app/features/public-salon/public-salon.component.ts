import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AvailabilitySlot,
  PublicProfessional,
  PublicSalonService,
  PublicService,
  PublicTenant,
} from '../../core/services/public-salon.service';
import {
  resolveServiceGender,
  resolveServiceImageUrl,
  serviceGenderLabel,
  ServiceGender,
} from '../../core/utils/service-image.util';

type BookingStep = 'service' | 'professional' | 'datetime' | 'confirm' | 'done';

type CalendarDay = {
  date: Date;
  key: string;
  inMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isPast: boolean;
};

type StepItem = { id: BookingStep; label: string; number: number };

@Component({
  selector: 'app-public-salon',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-violet-950/20 text-slate-100">
      <header class="border-b border-slate-800/50 bg-slate-950/70 backdrop-blur-xl">
        <div class="mx-auto max-w-5xl px-6 py-6">
          <div class="flex items-center gap-4">
            @if (tenant()?.logoUrl) {
              <img
                [src]="tenant()!.logoUrl"
                [alt]="tenant()!.name"
                class="h-14 w-14 rounded-2xl border border-slate-700/80 object-cover shadow-lg shadow-violet-950/40"
              />
            } @else {
              <div
                class="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-700 text-lg font-bold text-white shadow-lg shadow-violet-950/40"
              >
                {{ tenant()?.name?.charAt(0) ?? 'S' }}
              </div>
            }
            <div class="min-w-0">
              @if (tenant()) {
                <p class="text-xs font-medium uppercase tracking-[0.2em] text-violet-300/90">
                  Agende online
                </p>
                <h1 class="truncate text-2xl font-semibold tracking-tight text-white md:text-3xl">
                  {{ tenant()!.name }}
                </h1>
                @if (tenant()!.description) {
                  <p class="mt-1 line-clamp-2 text-sm text-slate-400">{{ tenant()!.description }}</p>
                }
              } @else if (!loading()) {
                <h1 class="text-2xl font-semibold text-white">Salao nao encontrado</h1>
              }
            </div>
          </div>
        </div>
      </header>

      <main class="mx-auto max-w-5xl px-6 py-8 md:py-10">
        @if (loading()) {
          <p class="text-slate-400">Carregando...</p>
        } @else if (error()) {
          <section class="rounded-2xl border border-slate-800 bg-slate-900/80 p-8 text-center">
            <p class="text-rose-400">{{ error() }}</p>
          </section>
        } @else if (tenant()) {
          @if (step() === 'done' && confirmation()) {
            <section
              class="rounded-3xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 to-slate-900/80 p-8 text-center shadow-xl shadow-emerald-950/20"
            >
              <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-2xl text-emerald-300">
                ✓
              </div>
              <h2 class="text-2xl font-semibold text-white">Agendamento confirmado</h2>
              <p class="mt-3 text-slate-300">
                {{ confirmation()!.guestName }}, reservamos seu horario para
                <span class="font-medium text-white">{{ formatSlotLabel(confirmation()!.startAt) }}</span>.
              </p>
              <button
                type="button"
                (click)="restartBooking()"
                class="mt-8 rounded-xl bg-violet-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-violet-500"
              >
                Fazer outro agendamento
              </button>
            </section>
          } @else {
            <section class="mb-8 rounded-3xl border border-slate-800/80 bg-slate-900/50 p-5 shadow-xl shadow-black/20 md:p-7">
              <ol class="grid gap-3 sm:grid-cols-4">
                @for (item of bookingSteps; track item.id) {
                  <li class="flex items-center gap-3">
                    <span
                      class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition"
                      [class.bg-violet-600]="isStepActive(item.id)"
                      [class.text-white]="isStepActive(item.id)"
                      [class.bg-slate-800]="!isStepActive(item.id)"
                      [class.text-slate-500]="!isStepActive(item.id) && !isStepComplete(item.id)"
                      [class.bg-violet-500/20]="!isStepActive(item.id) && isStepComplete(item.id)"
                      [class.text-violet-200]="!isStepActive(item.id) && isStepComplete(item.id)"
                    >
                      {{ item.number }}
                    </span>
                    <span
                      class="text-sm font-medium"
                      [class.text-white]="isStepActive(item.id)"
                      [class.text-slate-500]="!isStepActive(item.id)"
                    >
                      {{ item.label }}
                    </span>
                  </li>
                }
              </ol>

              @if (selectedService() || selectedProfessional() || selectedSlot()) {
                <div class="mt-5 flex flex-wrap gap-2 border-t border-slate-800/80 pt-5">
                  @if (selectedService()) {
                    <span class="rounded-full bg-slate-800/80 px-3 py-1 text-xs text-slate-300">
                      {{ selectedService()!.name }}
                    </span>
                  }
                  @if (selectedProfessional()) {
                    <span class="rounded-full bg-slate-800/80 px-3 py-1 text-xs text-slate-300">
                      {{ selectedProfessional()!.name }}
                    </span>
                  }
                  @if (selectedSlot()) {
                    <span class="rounded-full bg-violet-500/15 px-3 py-1 text-xs text-violet-200">
                      {{ formatSlotTime(selectedSlot()!.startAt) }}
                    </span>
                  }
                </div>
              }
            </section>

            @if (step() === 'service') {
              <section class="space-y-8">
                <div>
                  <h2 class="text-xl font-semibold text-white">Escolha seu servico</h2>
                  <p class="mt-1 text-sm text-slate-400">Selecione o que deseja agendar hoje.</p>
                </div>

                @if (services().length === 0) {
                  <p class="text-slate-400">Nenhum servico disponivel no momento.</p>
                } @else {
                  @for (group of serviceGroups(); track group.gender) {
                    <div>
                      <div class="mb-4 flex items-center gap-3">
                        <span
                          class="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider"
                          [class.bg-sky-500/15]="group.gender === 'masculino'"
                          [class.text-sky-200]="group.gender === 'masculino'"
                          [class.bg-fuchsia-500/15]="group.gender === 'feminino'"
                          [class.text-fuchsia-200]="group.gender === 'feminino'"
                        >
                          {{ group.label }}
                        </span>
                        <span class="h-px flex-1 bg-slate-800"></span>
                      </div>
                      <div class="grid gap-4 sm:grid-cols-2">
                        @for (service of group.services; track service.publicId) {
                          <button
                            type="button"
                            (click)="selectService(service)"
                            class="group overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 text-left transition hover:-translate-y-0.5 hover:border-violet-500/40 hover:shadow-lg hover:shadow-violet-950/30"
                          >
                            <div class="relative aspect-[16/10] overflow-hidden bg-slate-950">
                              <img
                                [src]="serviceImage(service)"
                                [alt]="service.name"
                                class="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                              />
                              <div
                                class="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent"
                              ></div>
                            </div>
                            <div class="p-5">
                              <h3 class="font-semibold text-white">{{ service.name }}</h3>
                              @if (service.description) {
                                <p class="mt-2 line-clamp-2 text-sm text-slate-400">
                                  {{ service.description }}
                                </p>
                              }
                              <div class="mt-4 flex items-center justify-between text-sm">
                                <span class="rounded-full bg-slate-800 px-2.5 py-1 text-slate-300">
                                  {{ service.durationMinutes }} min
                                </span>
                                <span class="font-semibold text-emerald-400">{{
                                  formatCurrency(service.price)
                                }}</span>
                              </div>
                            </div>
                          </button>
                        }
                      </div>
                    </div>
                  }
                }
              </section>
            }

            @if (step() === 'professional') {
              <section>
                <div class="mb-6 flex items-center gap-3">
                  <button
                    type="button"
                    (click)="goBack('service')"
                    class="rounded-lg px-3 py-1.5 text-sm text-violet-300 transition hover:bg-violet-500/10"
                  >
                    Voltar
                  </button>
                  <div>
                    <h2 class="text-xl font-semibold text-white">Escolha o profissional</h2>
                    <p class="text-sm text-slate-400">Quem vai te atender?</p>
                  </div>
                </div>
                @if (professionalsLoading()) {
                  <p class="text-slate-400">Carregando profissionais...</p>
                } @else if (professionals().length === 0) {
                  <p class="text-slate-400">Nenhum profissional disponivel para agendamento.</p>
                } @else {
                  <div class="grid gap-3 sm:grid-cols-2">
                    @for (pro of professionals(); track pro.publicId) {
                      <button
                        type="button"
                        (click)="selectProfessional(pro)"
                        class="rounded-2xl border border-slate-800 bg-slate-900/70 px-5 py-5 text-left transition hover:border-violet-500/40 hover:bg-slate-900"
                      >
                        <span class="font-medium text-white">{{ pro.name }}</span>
                      </button>
                    }
                  </div>
                }
              </section>
            }

            @if (step() === 'datetime') {
              <section class="space-y-6">
                <div class="flex items-center gap-3">
                  <button
                    type="button"
                    (click)="goBack('professional')"
                    class="rounded-lg px-3 py-1.5 text-sm text-violet-300 transition hover:bg-violet-500/10"
                  >
                    Voltar
                  </button>
                  <div>
                    <h2 class="text-xl font-semibold text-white">Data e horario</h2>
                    <p class="text-sm text-slate-400">Escolha quando deseja ser atendido.</p>
                  </div>
                </div>

                <div class="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 md:p-5">
                  <div class="mb-4 flex items-center justify-between">
                    <button
                      type="button"
                      (click)="prevMonth()"
                      class="rounded-lg px-3 py-1.5 text-sm text-slate-400 transition hover:bg-slate-800 hover:text-white"
                    >
                      Anterior
                    </button>
                    <p class="font-medium capitalize text-white">{{ monthLabel() }}</p>
                    <button
                      type="button"
                      (click)="nextMonth()"
                      class="rounded-lg px-3 py-1.5 text-sm text-slate-400 transition hover:bg-slate-800 hover:text-white"
                    >
                      Proximo
                    </button>
                  </div>
                  <div class="grid grid-cols-7 gap-1 text-center text-xs text-slate-500">
                    @for (label of weekdayLabels; track label) {
                      <div class="py-2">{{ label }}</div>
                    }
                  </div>
                  <div class="grid grid-cols-7 gap-1">
                    @for (day of calendarDays(); track day.key) {
                      <button
                        type="button"
                        [disabled]="day.isPast || !day.inMonth"
                        (click)="selectDate(day)"
                        class="rounded-xl py-2.5 text-sm transition"
                        [class.text-slate-600]="!day.inMonth"
                        [class.text-slate-500]="day.inMonth && day.isPast"
                        [class.text-white]="day.inMonth && !day.isPast"
                        [class.bg-violet-600]="day.isSelected"
                        [class.shadow-md]="day.isSelected"
                        [class.shadow-violet-900/40]="day.isSelected"
                        [class.ring-1]="day.isToday && !day.isSelected"
                        [class.ring-violet-400/40]="day.isToday && !day.isSelected"
                        [class.hover:bg-slate-800]="day.inMonth && !day.isPast && !day.isSelected"
                      >
                        {{ day.date.getDate() }}
                      </button>
                    }
                  </div>
                </div>

                @if (selectedDate()) {
                  <div>
                    <h3 class="text-sm font-medium text-white">
                      Horarios livres em {{ formatDateLabel(selectedDate()!) }}
                    </h3>
                    @if (slotsLoading()) {
                      <p class="mt-3 text-sm text-slate-400">Carregando horarios...</p>
                    } @else if (slotsError()) {
                      <p class="mt-3 text-sm text-rose-400">{{ slotsError() }}</p>
                    } @else if (slots().length === 0) {
                      <p class="mt-3 text-sm text-slate-400">Nenhum horario livre neste dia.</p>
                    } @else {
                      <div class="mt-3 flex flex-wrap gap-2">
                        @for (slot of slots(); track slot.startAt) {
                          <button
                            type="button"
                            (click)="selectSlot(slot)"
                            class="rounded-xl border px-4 py-2.5 text-sm transition"
                            [class.border-violet-500]="selectedSlot()?.startAt === slot.startAt"
                            [class.bg-violet-600]="selectedSlot()?.startAt === slot.startAt"
                            [class.text-white]="selectedSlot()?.startAt === slot.startAt"
                            [class.border-slate-700]="selectedSlot()?.startAt !== slot.startAt"
                            [class.text-slate-300]="selectedSlot()?.startAt !== slot.startAt"
                            [class.hover:border-violet-500/50]="selectedSlot()?.startAt !== slot.startAt"
                          >
                            {{ formatSlotTime(slot.startAt) }}
                          </button>
                        }
                      </div>
                    }

                    @if (selectedSlot()) {
                      <button
                        type="button"
                        (click)="step.set('confirm')"
                        class="mt-6 rounded-xl bg-violet-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-violet-500"
                      >
                        Continuar
                      </button>
                    }
                  </div>
                }
              </section>
            }

            @if (step() === 'confirm') {
              <section class="max-w-lg">
                <div class="mb-6 flex items-center gap-3">
                  <button
                    type="button"
                    (click)="goBack('datetime')"
                    class="rounded-lg px-3 py-1.5 text-sm text-violet-300 transition hover:bg-violet-500/10"
                  >
                    Voltar
                  </button>
                  <div>
                    <h2 class="text-xl font-semibold text-white">Confirmar</h2>
                    <p class="text-sm text-slate-400">Informe seus dados para finalizar.</p>
                  </div>
                </div>

                <form
                  class="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-6"
                  [formGroup]="guestForm"
                  (ngSubmit)="confirmBooking()"
                >
                  <div>
                    <label class="mb-1 block text-sm text-slate-300">Nome completo</label>
                    <input
                      formControlName="guestName"
                      class="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label class="mb-1 block text-sm text-slate-300">WhatsApp</label>
                    <input
                      formControlName="guestPhone"
                      placeholder="(11) 99999-9999"
                      class="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-violet-500"
                    />
                  </div>

                  @if (bookingError()) {
                    <p class="text-sm text-rose-400">{{ bookingError() }}</p>
                  }

                  <button
                    type="submit"
                    [disabled]="guestForm.invalid || booking()"
                    class="w-full rounded-xl bg-violet-600 px-4 py-3 font-medium text-white transition hover:bg-violet-500 disabled:opacity-50"
                  >
                    {{ booking() ? 'Confirmando...' : 'Confirmar agendamento' }}
                  </button>
                </form>
              </section>
            }

            @if (hasContactFooter()) {
              <section class="mt-10 rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6">
                @if (tenant()!.address) {
                  <p class="text-sm text-slate-400">
                    <span class="font-medium text-slate-300">Endereco:</span> {{ tenant()!.address }}
                  </p>
                }
                @if (tenant()!.whatsapp) {
                  <p class="mt-2 text-sm text-slate-400">
                    <span class="font-medium text-slate-300">WhatsApp:</span> {{ tenant()!.whatsapp }}
                  </p>
                }
                @if (hasSocialLinks()) {
                  <div class="mt-4 flex flex-wrap gap-3">
                    @if (tenant()!.instagramUrl) {
                      <a
                        [href]="tenant()!.instagramUrl"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="rounded-full bg-slate-800 px-3 py-1.5 text-xs text-slate-300 transition hover:text-white"
                      >
                        Instagram
                      </a>
                    }
                    @if (tenant()!.facebookUrl) {
                      <a
                        [href]="tenant()!.facebookUrl"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="rounded-full bg-slate-800 px-3 py-1.5 text-xs text-slate-300 transition hover:text-white"
                      >
                        Facebook
                      </a>
                    }
                    @if (tenant()!.tiktokUrl) {
                      <a
                        [href]="tenant()!.tiktokUrl"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="rounded-full bg-slate-800 px-3 py-1.5 text-xs text-slate-300 transition hover:text-white"
                      >
                        TikTok
                      </a>
                    }
                    @if (tenant()!.websiteUrl) {
                      <a
                        [href]="tenant()!.websiteUrl"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="rounded-full bg-slate-800 px-3 py-1.5 text-xs text-slate-300 transition hover:text-white"
                      >
                        Site
                      </a>
                    }
                    @if (tenant()!.googleMapsUrl) {
                      <a
                        [href]="tenant()!.googleMapsUrl"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="rounded-full bg-slate-800 px-3 py-1.5 text-xs text-slate-300 transition hover:text-white"
                      >
                        Como chegar
                      </a>
                    }
                  </div>
                }
              </section>
            }
          }
        }
      </main>
    </div>
  `,
})
export class PublicSalonComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly publicSalon = inject(PublicSalonService);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly fb = inject(FormBuilder);

  protected readonly weekdayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

  protected readonly bookingSteps: StepItem[] = [
    { id: 'service', label: 'Servico', number: 1 },
    { id: 'professional', label: 'Profissional', number: 2 },
    { id: 'datetime', label: 'Data e horario', number: 3 },
    { id: 'confirm', label: 'Confirmar', number: 4 },
  ];

  protected readonly tenant = signal<PublicTenant | null>(null);
  protected readonly services = signal<PublicService[]>([]);
  protected readonly professionals = signal<PublicProfessional[]>([]);
  protected readonly slots = signal<AvailabilitySlot[]>([]);

  protected readonly loading = signal(true);
  protected readonly professionalsLoading = signal(false);
  protected readonly slotsLoading = signal(false);
  protected readonly booking = signal(false);

  protected readonly error = signal<string | null>(null);
  protected readonly slotsError = signal<string | null>(null);
  protected readonly bookingError = signal<string | null>(null);

  protected readonly step = signal<BookingStep>('service');
  protected readonly selectedService = signal<PublicService | null>(null);
  protected readonly selectedProfessional = signal<PublicProfessional | null>(null);
  protected readonly selectedDate = signal<string | null>(null);
  protected readonly selectedSlot = signal<AvailabilitySlot | null>(null);
  protected readonly confirmation = signal<{ guestName: string; startAt: string } | null>(null);

  protected readonly calendarMonth = signal(this.startOfMonth(new Date()));

  protected readonly guestForm = this.fb.nonNullable.group({
    guestName: ['', [Validators.required, Validators.minLength(2)]],
    guestPhone: ['', [Validators.required, Validators.minLength(8)]],
  });

  private slug = '';

  protected readonly calendarDays = computed(() => this.buildCalendarDays());
  protected readonly monthLabel = computed(() =>
    new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(this.calendarMonth())
  );

  protected readonly serviceGroups = computed(() => {
    const groups = new Map<ServiceGender, PublicService[]>();
    for (const service of this.services()) {
      const gender = resolveServiceGender(service.name, service.description);
      const list = groups.get(gender) ?? [];
      list.push(service);
      groups.set(gender, list);
    }

    const ordered: ServiceGender[] = ['feminino', 'masculino'];
    return ordered
      .filter((gender) => (groups.get(gender)?.length ?? 0) > 0)
      .map((gender) => ({
        gender,
        label: serviceGenderLabel(gender),
        services: groups.get(gender) ?? [],
      }));
  });

  ngOnInit(): void {
    this.slug = this.route.snapshot.paramMap.get('slug') ?? environment.publicTenantSlug;
    if (!this.slug) {
      this.error.set('Salao invalido.');
      this.loading.set(false);
      return;
    }

    forkJoin({
      tenant: this.publicSalon.getTenant(this.slug),
      services: this.publicSalon.listServices(this.slug),
    }).subscribe({
      next: ({ tenant, services }) => {
        this.tenant.set(tenant);
        this.services.set(services);
        this.applySeo(tenant);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Salao nao encontrado ou indisponivel.');
        this.loading.set(false);
      },
    });
  }

  protected serviceImage(service: PublicService): string {
    return resolveServiceImageUrl(service.name, service.description, service.imageUrl);
  }

  protected isStepActive(step: BookingStep): boolean {
    return this.step() === step;
  }

  protected isStepComplete(step: BookingStep): boolean {
    const order: BookingStep[] = ['service', 'professional', 'datetime', 'confirm', 'done'];
    return order.indexOf(this.step()) > order.indexOf(step);
  }

  protected hasSocialLinks(): boolean {
    const tenant = this.tenant();
    if (!tenant) return false;
    return !!(
      tenant.instagramUrl ||
      tenant.facebookUrl ||
      tenant.tiktokUrl ||
      tenant.websiteUrl ||
      tenant.googleMapsUrl
    );
  }

  protected hasContactFooter(): boolean {
    const tenant = this.tenant();
    if (!tenant) return false;
    return !!(tenant.address || tenant.whatsapp || this.hasSocialLinks());
  }

  protected selectService(service: PublicService): void {
    this.selectedService.set(service);
    this.selectedProfessional.set(null);
    this.selectedDate.set(null);
    this.selectedSlot.set(null);
    this.slots.set([]);
    this.step.set('professional');
    this.loadProfessionals();
  }

  protected selectProfessional(pro: PublicProfessional): void {
    this.selectedProfessional.set(pro);
    this.selectedDate.set(null);
    this.selectedSlot.set(null);
    this.slots.set([]);
    this.step.set('datetime');
  }

  protected selectDate(day: CalendarDay): void {
    if (day.isPast || !day.inMonth) return;
    const iso = this.toIsoDate(day.date);
    this.selectedDate.set(iso);
    this.selectedSlot.set(null);
    this.loadSlots(iso);
  }

  protected selectSlot(slot: AvailabilitySlot): void {
    this.selectedSlot.set(slot);
  }

  protected goBack(target: BookingStep): void {
    this.step.set(target);
    this.bookingError.set(null);
  }

  protected prevMonth(): void {
    const current = this.calendarMonth();
    this.calendarMonth.set(new Date(current.getFullYear(), current.getMonth() - 1, 1));
  }

  protected nextMonth(): void {
    const current = this.calendarMonth();
    this.calendarMonth.set(new Date(current.getFullYear(), current.getMonth() + 1, 1));
  }

  protected confirmBooking(): void {
    const service = this.selectedService();
    const professional = this.selectedProfessional();
    const slot = this.selectedSlot();
    if (!service || !professional || !slot || this.guestForm.invalid || this.booking()) return;

    this.booking.set(true);
    this.bookingError.set(null);
    const { guestName, guestPhone } = this.guestForm.getRawValue();

    this.publicSalon
      .createGuestAppointment(this.slug, {
        servicePublicId: service.publicId,
        professionalPublicId: professional.publicId,
        startAt: slot.startAt,
        guestName,
        guestPhone,
      })
      .subscribe({
        next: (response) => {
          this.booking.set(false);
          this.confirmation.set({ guestName: response.guestName, startAt: response.startAt });
          this.step.set('done');
        },
        error: (err) => {
          this.booking.set(false);
          const message =
            err?.error?.message ?? 'Este horario nao esta mais disponivel. Escolha outro.';
          this.bookingError.set(message);
        },
      });
  }

  protected restartBooking(): void {
    this.step.set('service');
    this.selectedService.set(null);
    this.selectedProfessional.set(null);
    this.selectedDate.set(null);
    this.selectedSlot.set(null);
    this.confirmation.set(null);
    this.guestForm.reset();
    this.bookingError.set(null);
  }

  protected formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  protected formatSlotTime(value: string): string {
    return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(
      new Date(value)
    );
  }

  protected formatSlotLabel(value: string): string {
    return new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  }

  protected formatDateLabel(isoDate: string): string {
    const [year, month, day] = isoDate.split('-').map(Number);
    return new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date(year, month - 1, day));
  }

  private loadProfessionals(): void {
    this.professionalsLoading.set(true);
    this.publicSalon.listProfessionals(this.slug).subscribe({
      next: (items) => {
        this.professionals.set(items);
        this.professionalsLoading.set(false);
      },
      error: () => {
        this.professionalsLoading.set(false);
        this.error.set('Nao foi possivel carregar profissionais.');
      },
    });
  }

  private loadSlots(isoDate: string): void {
    const service = this.selectedService();
    const professional = this.selectedProfessional();
    if (!service || !professional) return;

    this.slotsLoading.set(true);
    this.slotsError.set(null);
    this.publicSalon
      .getAvailabilitySlots(this.slug, professional.publicId, service.publicId, isoDate)
      .subscribe({
        next: (items) => {
          this.slots.set(items);
          this.slotsLoading.set(false);
        },
        error: () => {
          this.slotsLoading.set(false);
          this.slotsError.set('Nao foi possivel carregar horarios.');
        },
      });
  }

  private buildCalendarDays(): CalendarDay[] {
    const monthStart = this.calendarMonth();
    const year = monthStart.getFullYear();
    const month = monthStart.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = firstDay.getDay();
    const gridStart = new Date(year, month, 1 - startOffset);
    const todayKey = this.toIsoDate(new Date());
    const selected = this.selectedDate();
    const days: CalendarDay[] = [];

    for (let i = 0; i < 42; i++) {
      const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
      const key = this.toIsoDate(date);
      const isPast = key < todayKey;
      days.push({
        date,
        key,
        inMonth: date.getMonth() === month,
        isToday: key === todayKey,
        isSelected: selected === key,
        isPast,
      });
    }

    return days;
  }

  private applySeo(tenant: PublicTenant): void {
    const title = tenant.seoTitle?.trim() || `${tenant.name} | Agende online`;
    const description =
      tenant.seoDescription?.trim() ||
      tenant.description?.trim() ||
      `Agende online no ${tenant.name}.`;

    this.title.setTitle(title);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    if (tenant.seoImageUrl) {
      this.meta.updateTag({ property: 'og:image', content: tenant.seoImageUrl });
    }
  }

  private startOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  private toIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
