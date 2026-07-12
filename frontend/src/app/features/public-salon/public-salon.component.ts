import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AvailabilitySlot,
  PublicProfessional,
  PublicSalonService,
  PublicService,
  PublicTenant,
} from '../../core/services/public-salon.service';

type BookingStep = 'service' | 'professional' | 'datetime' | 'confirm' | 'done';

type CalendarDay = {
  date: Date;
  key: string;
  inMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isPast: boolean;
};

@Component({
  selector: 'app-public-salon',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-slate-950 text-slate-100">
      <header class="border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-xl">
        <div class="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <div class="min-w-0">
            @if (tenant()) {
              @if (tenant()!.logoUrl) {
                <img [src]="tenant()!.logoUrl" [alt]="tenant()!.name" class="mb-2 h-10 w-auto" />
              }
              <p class="text-xs uppercase tracking-wider text-violet-400">Agende online</p>
              <h1 class="truncate text-2xl font-bold text-white">{{ tenant()!.name }}</h1>
              @if (tenant()!.description) {
                <p class="mt-1 max-w-xl truncate text-sm text-slate-400">{{ tenant()!.description }}</p>
              }
            } @else if (!loading()) {
              <h1 class="text-2xl font-bold text-white">Salao nao encontrado</h1>
            }
          </div>
          <a
            routerLink="/login"
            class="shrink-0 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-500"
          >
            Entrar
          </a>
        </div>
      </header>

      <main class="mx-auto max-w-5xl px-6 py-10">
        @if (loading()) {
          <p class="text-slate-400">Carregando...</p>
        } @else if (error()) {
          <section class="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center">
            <p class="text-rose-400">{{ error() }}</p>
          </section>
        } @else if (tenant()) {
          @if (step() === 'done' && confirmation()) {
            <section class="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-8 text-center">
              <h2 class="text-2xl font-semibold text-white">Agendamento confirmado!</h2>
              <p class="mt-2 text-slate-300">
                {{ confirmation()!.guestName }}, seu horario foi reservado para
                {{ formatSlotLabel(confirmation()!.startAt) }}.
              </p>
              <button
                type="button"
                (click)="restartBooking()"
                class="mt-6 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-500"
              >
                Fazer outro agendamento
              </button>
            </section>
          } @else {
            <section class="mb-8 rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-violet-950/30 to-slate-900 p-6 md:p-8">
              <div class="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wider text-violet-300">
                <span [class.text-white]="step() === 'service'">1. Servico</span>
                <span class="text-slate-600">/</span>
                <span [class.text-white]="step() === 'professional'">2. Profissional</span>
                <span class="text-slate-600">/</span>
                <span [class.text-white]="step() === 'datetime'">3. Data e horario</span>
                <span class="text-slate-600">/</span>
                <span [class.text-white]="step() === 'confirm'">4. Confirmar</span>
              </div>

              @if (selectedService()) {
                <p class="mt-4 text-sm text-slate-400">
                  Servico:
                  <span class="text-white">{{ selectedService()!.name }}</span>
                  ({{ selectedService()!.durationMinutes }} min)
                </p>
              }
              @if (selectedProfessional()) {
                <p class="text-sm text-slate-400">
                  Profissional: <span class="text-white">{{ selectedProfessional()!.name }}</span>
                </p>
              }
              @if (selectedSlot()) {
                <p class="text-sm text-slate-400">
                  Horario: <span class="text-white">{{ formatSlotLabel(selectedSlot()!.startAt) }}</span>
                </p>
              }
            </section>

            @if (step() === 'service') {
              <section>
                <h2 class="text-lg font-semibold text-white">Escolha o servico</h2>
                @if (services().length === 0) {
                  <p class="mt-4 text-slate-400">Nenhum servico disponivel no momento.</p>
                } @else {
                  <div class="mt-4 grid gap-4 sm:grid-cols-2">
                    @for (service of services(); track service.publicId) {
                      <button
                        type="button"
                        (click)="selectService(service)"
                        class="rounded-xl border border-slate-800 bg-slate-900 p-5 text-left transition hover:border-violet-500/50 hover:bg-slate-900/80"
                      >
                        <h3 class="font-semibold text-white">{{ service.name }}</h3>
                        @if (service.description) {
                          <p class="mt-2 text-sm text-slate-400">{{ service.description }}</p>
                        }
                        <div class="mt-4 flex items-center justify-between text-sm">
                          <span class="text-slate-400">{{ service.durationMinutes }} min</span>
                          <span class="font-semibold text-emerald-400">{{ formatCurrency(service.price) }}</span>
                        </div>
                      </button>
                    }
                  </div>
                }
              </section>
            }

            @if (step() === 'professional') {
              <section>
                <div class="mb-4 flex items-center gap-3">
                  <button type="button" (click)="goBack('service')" class="text-sm text-violet-400 hover:text-violet-300">
                    Voltar
                  </button>
                  <h2 class="text-lg font-semibold text-white">Escolha o profissional</h2>
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
                        class="rounded-xl border border-slate-800 bg-slate-900 px-5 py-4 text-left transition hover:border-violet-500/50"
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
                  <button type="button" (click)="goBack('professional')" class="text-sm text-violet-400 hover:text-violet-300">
                    Voltar
                  </button>
                  <h2 class="text-lg font-semibold text-white">Escolha data e horario</h2>
                </div>

                <div class="rounded-xl border border-slate-800 bg-slate-900 p-4">
                  <div class="mb-4 flex items-center justify-between">
                    <button type="button" (click)="prevMonth()" class="rounded-lg px-3 py-1 text-sm text-slate-400 hover:bg-slate-800 hover:text-white">
                      Anterior
                    </button>
                    <p class="font-medium capitalize text-white">{{ monthLabel() }}</p>
                    <button type="button" (click)="nextMonth()" class="rounded-lg px-3 py-1 text-sm text-slate-400 hover:bg-slate-800 hover:text-white">
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
                        class="rounded-lg py-2 text-sm transition"
                        [class.text-slate-600]="!day.inMonth"
                        [class.text-slate-500]="day.inMonth && day.isPast"
                        [class.text-white]="day.inMonth && !day.isPast"
                        [class.bg-violet-600]="day.isSelected"
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
                    <h3 class="text-sm font-medium text-white">Horarios livres em {{ formatDateLabel(selectedDate()!) }}</h3>
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
                            class="rounded-lg border px-3 py-2 text-sm transition"
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
                        class="mt-6 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-500"
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
                <div class="mb-4 flex items-center gap-3">
                  <button type="button" (click)="goBack('datetime')" class="text-sm text-violet-400 hover:text-violet-300">
                    Voltar
                  </button>
                  <h2 class="text-lg font-semibold text-white">Seus dados</h2>
                </div>

                <form class="space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-6" [formGroup]="guestForm" (ngSubmit)="confirmBooking()">
                  <div>
                    <label class="mb-1 block text-sm text-slate-300">Nome completo</label>
                    <input
                      formControlName="guestName"
                      class="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label class="mb-1 block text-sm text-slate-300">WhatsApp</label>
                    <input
                      formControlName="guestPhone"
                      placeholder="(11) 99999-9999"
                      class="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-violet-500"
                    />
                  </div>

                  @if (bookingError()) {
                    <p class="text-sm text-rose-400">{{ bookingError() }}</p>
                  }

                  <button
                    type="submit"
                    [disabled]="guestForm.invalid || booking()"
                    class="w-full rounded-lg bg-violet-600 px-4 py-2.5 font-medium text-white hover:bg-violet-500 disabled:opacity-50"
                  >
                    {{ booking() ? 'Confirmando...' : 'Confirmar agendamento' }}
                  </button>
                </form>
              </section>
            }

            @if (tenant()!.address || tenant()!.whatsapp) {
              <section class="mt-10 rounded-xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-400">
                @if (tenant()!.address) {
                  <p><span class="text-slate-300">Endereco:</span> {{ tenant()!.address }}</p>
                }
                @if (tenant()!.whatsapp) {
                  <p class="mt-2"><span class="text-slate-300">WhatsApp:</span> {{ tenant()!.whatsapp }}</p>
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
