import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PhoneMaskDirective } from '../../core/directives/phone-mask.directive';
import {
  AvailabilitySlot,
  PublicProfessional,
  PublicSalonService,
  PublicService,
  PublicTenant,
} from '../../core/services/public-salon.service';
import {
  buildGoogleMapsEmbedUrl,
  buildGoogleMapsOpenUrl,
  buildOsmStaticMapUrl,
  extractMapCoordinates,
} from '../../core/utils/maps.util';
import {
  buildWhatsAppUrl,
  formatPhoneDisplay,
  isValidBrazilianPhone,
  normalizePhoneValue,
} from '../../core/utils/phone.util';
import { scrollToSection } from '../../core/utils/scroll.util';
import {
  resolveServiceImageUrl,
  serviceGenderLabel,
  serviceGroupGender,
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
  isClosed: boolean;
};

type StepItem = { id: BookingStep; label: string; number: number };

type NavSection = { id: string; label: string; mobileLabel: string; icon: PublicNavIcon };

type PublicNavIcon = 'home' | 'services' | 'calendar' | 'map' | 'contact';

type BookingConfirmation = {
  guestName: string;
  guestPhone: string;
  startAt: string;
  endAt: string;
  serviceName: string;
  serviceDurationMinutes: number;
  servicePrice: number;
  professionalName: string;
  professionalPhone?: string;
  salonName: string;
};

@Component({
  selector: 'app-public-salon',
  standalone: true,
  imports: [ReactiveFormsModule, PhoneMaskDirective, NgTemplateOutlet],
  template: `
    <div class="app-view min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-violet-950/20 pb-[4.5rem] text-slate-100 md:pb-0">
      <header
        class="sticky top-0 z-50 border-b border-slate-800/50 bg-slate-950/85 backdrop-blur-xl transition-shadow duration-300"
      >
        <div class="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 md:px-6 md:py-4">
          <button
            type="button"
            (click)="scrollTo('inicio')"
            class="flex min-w-0 shrink-0 items-center gap-3 text-left transition hover:opacity-90"
          >
            @if (tenant()?.logoUrl) {
              <img
                [src]="tenant()!.logoUrl"
                [alt]="tenant()!.name"
                class="h-11 w-11 rounded-xl border border-slate-700/80 object-cover shadow-lg shadow-violet-950/40 md:h-12 md:w-12 md:rounded-2xl"
              />
            } @else {
              <div
                class="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-700 text-base font-bold text-white shadow-lg shadow-violet-950/40 md:h-12 md:w-12 md:rounded-2xl"
              >
                {{ tenant()?.name?.charAt(0) ?? 'S' }}
              </div>
            }
            @if (tenant()) {
              <span class="truncate text-base font-semibold text-white md:text-lg">{{ tenant()!.name }}</span>
            }
          </button>

          @if (tenant()) {
            <nav
              class="ml-auto hidden max-w-full items-center gap-1 overflow-x-auto md:flex"
              aria-label="Navegacao principal"
            >
              @for (item of navSections; track item.id) {
                <button
                  type="button"
                  (click)="scrollTo(item.id)"
                  class="shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 transition hover:bg-slate-800/80 hover:text-white"
                >
                  {{ item.label }}
                </button>
              }
            </nav>
          }
        </div>
      </header>

      <main class="mx-auto max-w-6xl px-4 md:px-6">
        @if (loading()) {
          <p class="py-16 text-slate-400">Carregando...</p>
        } @else if (error()) {
          <section class="page-section rounded-2xl border border-slate-800 bg-slate-900/80 p-8 text-center">
            <p class="text-rose-400">{{ error() }}</p>
          </section>
        } @else if (tenant()) {
          <section
            id="inicio"
            class="page-section pt-4 pb-8 md:pt-6 md:pb-10"
          >
            <div
              class="relative overflow-hidden rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-950/60 via-slate-900/80 to-fuchsia-950/40 p-6 shadow-2xl shadow-violet-950/30 md:p-8"
            >
              <div
                class="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-violet-600/20 blur-3xl"
              ></div>
              <div
                class="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-fuchsia-600/15 blur-3xl"
              ></div>

              <p class="text-xs font-semibold uppercase tracking-[0.25em] text-violet-300">Quem somos</p>
              <h1 class="mt-3 text-3xl font-bold tracking-tight text-white md:text-5xl">
                {{ tenant()!.name }}
              </h1>
              <p class="mt-4 max-w-2xl text-base leading-relaxed text-slate-300 md:text-lg">
                {{ aboutText() }}
              </p>
              <div class="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  (click)="scrollTo('servicos')"
                  class="rounded-xl bg-violet-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-violet-500"
                >
                  Ver servicos
                </button>
                <button
                  type="button"
                  (click)="scrollTo('agenda')"
                  class="rounded-xl border border-slate-600/80 bg-slate-900/50 px-5 py-3 text-sm font-medium text-slate-200 transition hover:border-violet-500/50 hover:text-white"
                >
                  Agendar agora
                </button>
              </div>
            </div>
          </section>

          <section id="servicos" class="page-section border-t border-slate-800/60 py-12 md:py-16">
            <div class="mb-6">
              <h2 class="text-2xl font-semibold text-white md:text-3xl">Nossos servicos</h2>
              <p class="mt-2 text-sm text-slate-400">Selecione o servico e continue para agendar.</p>
            </div>

            @if (services().length === 0) {
              <p class="text-slate-400">Nenhum servico disponivel no momento.</p>
            } @else {
              <div
                class="mb-5 inline-flex rounded-xl border border-slate-800 bg-slate-900/60 p-1"
                role="tablist"
              >
                @for (gender of genderTabs; track gender) {
                  <button
                    type="button"
                    role="tab"
                    [attr.aria-selected]="activeGenderTab() === gender"
                    (click)="setGenderTab(gender)"
                    class="rounded-lg px-4 py-2 text-sm font-semibold uppercase tracking-wide transition"
                    [class.bg-sky-600]="activeGenderTab() === gender && gender === 'masculino'"
                    [class.bg-fuchsia-600]="activeGenderTab() === gender && gender === 'feminino'"
                    [class.text-white]="activeGenderTab() === gender"
                    [class.text-slate-400]="activeGenderTab() !== gender"
                    [class.hover:text-white]="activeGenderTab() !== gender"
                  >
                    {{ genderLabel(gender) }}
                  </button>
                }
              </div>

              @if (activeTabServices().length === 0) {
                <p class="text-slate-400">Nenhum servico disponivel nesta categoria.</p>
              } @else {
              <div
                class="grid grid-cols-3 gap-1.5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7"
              >
                @for (service of activeTabServices(); track service.publicId) {
                  <button
                    type="button"
                    (click)="selectService(service)"
                    class="group flex flex-col overflow-hidden rounded-md border text-left transition duration-300 hover:-translate-y-0.5"
                    [class.border-violet-500]="selectedService()?.publicId === service.publicId"
                    [class.ring-2]="selectedService()?.publicId === service.publicId"
                    [class.ring-violet-500/40]="selectedService()?.publicId === service.publicId"
                    [class.border-slate-800/80]="selectedService()?.publicId !== service.publicId"
                    [class.bg-slate-900/60]="selectedService()?.publicId !== service.publicId"
                    [class.hover:border-violet-500/40]="selectedService()?.publicId !== service.publicId"
                  >
                    <div class="relative aspect-square overflow-hidden bg-slate-950">
                      <img
                        [src]="serviceImage(service)"
                        [alt]="service.name"
                        class="h-full w-full object-cover object-center transition duration-300 group-hover:scale-[1.03]"
                      />
                      <div
                        class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/75 to-transparent px-1.5 pb-1 pt-4"
                      >
                        <h3
                          class="truncate text-[8px] font-bold uppercase leading-tight tracking-wide text-white sm:text-[9px]"
                        >
                          {{ service.name }}
                        </h3>
                      </div>
                    </div>
                    <div class="flex items-center justify-between gap-0.5 px-1.5 py-1 text-[8px] sm:text-[9px]">
                      <span class="text-slate-500">{{ service.durationMinutes }}m</span>
                      <span
                        class="font-semibold"
                        [class.text-sky-400]="serviceGender(service) === 'masculino'"
                        [class.text-fuchsia-400]="serviceGender(service) === 'feminino'"
                      >
                        {{ formatCurrency(service.price) }}
                      </span>
                    </div>
                  </button>
                }
              </div>
              }
            }
          </section>

          <section id="agenda" class="page-section border-t border-slate-800/60 py-12 md:py-16">
            <div class="mb-6">
              <h2 class="text-2xl font-semibold text-white md:text-3xl">Agenda</h2>
              <p class="mt-2 text-sm text-slate-400">Escolha profissional, data e confirme seu horario.</p>
            </div>

            @if (step() === 'done' && confirmation()) {
              <div
                class="rounded-3xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 to-slate-900/80 p-8 text-center shadow-xl shadow-emerald-950/20"
              >
                <div
                  class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-2xl text-emerald-300"
                >
                  ✓
                </div>
                <h3 class="text-2xl font-semibold text-white">Agendamento confirmado</h3>
                <p class="mt-3 text-slate-300">
                  {{ confirmation()!.guestName }}, reservamos seu horario para
                  <span class="font-medium text-white">{{ formatSlotLabel(confirmation()!.startAt) }}</span>.
                </p>

                <div class="mx-auto mt-6 max-w-md rounded-2xl border border-slate-700/80 bg-slate-950/50 p-5 text-left">
                  <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">Resumo</p>
                  <dl class="mt-3 space-y-2 text-sm">
                    <div class="flex justify-between gap-4">
                      <dt class="text-slate-400">Servico</dt>
                      <dd class="text-right font-medium text-white">{{ confirmation()!.serviceName }}</dd>
                    </div>
                    <div class="flex justify-between gap-4">
                      <dt class="text-slate-400">Profissional</dt>
                      <dd class="text-right text-white">{{ confirmation()!.professionalName }}</dd>
                    </div>
                    <div class="flex justify-between gap-4">
                      <dt class="text-slate-400">Horario</dt>
                      <dd class="text-right text-white">
                        {{ formatTimeRange(confirmation()!.startAt, confirmation()!.endAt) }}
                      </dd>
                    </div>
                    <div class="flex justify-between gap-4">
                      <dt class="text-slate-400">Duracao</dt>
                      <dd class="text-right text-white">{{ confirmation()!.serviceDurationMinutes }} min</dd>
                    </div>
                    <div class="flex justify-between gap-4 border-t border-slate-800 pt-2">
                      <dt class="text-slate-400">Valor</dt>
                      <dd class="text-right font-semibold text-violet-300">
                        {{ formatCurrency(confirmation()!.servicePrice) }}
                      </dd>
                    </div>
                    <div class="flex justify-between gap-4">
                      <dt class="text-slate-400">WhatsApp</dt>
                      <dd class="text-right text-white">{{ confirmation()!.guestPhone }}</dd>
                    </div>
                  </dl>
                </div>
                <p class="mt-4 text-sm text-emerald-300">
                  Enviamos a confirmacao por WhatsApp para voce e para o profissional.
                </p>
                <div class="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <a
                    [href]="confirmationClientWhatsAppUrl()"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
                  >
                    Abrir confirmacao no WhatsApp
                  </a>
                  @if (confirmation()!.professionalPhone) {
                    <a
                      [href]="confirmationProfessionalWhatsAppUrl()"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="inline-flex items-center justify-center gap-2 rounded-xl border border-[#25D366]/40 bg-[#25D366]/10 px-5 py-3 text-sm font-medium text-[#25D366] transition hover:bg-[#25D366]/20"
                    >
                      WhatsApp do profissional
                    </a>
                  }
                </div>
                <button
                  type="button"
                  (click)="restartBooking()"
                  class="mt-8 rounded-xl bg-violet-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-violet-500"
                >
                  Fazer outro agendamento
                </button>
              </div>
            } @else {
              <div class="mb-8 rounded-3xl border border-slate-800/80 bg-slate-900/50 p-5 shadow-xl shadow-black/20 md:p-7">
                <ol class="grid gap-3 sm:grid-cols-4">
                  @for (item of bookingSteps; track item.id) {
                    <li class="flex items-center gap-3">
                      <span
                        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition duration-300"
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
                        class="text-sm font-medium transition-colors duration-300"
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
              </div>

              @if (step() === 'service') {
                <div
                  class="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-8 text-center transition duration-300"
                >
                  <p class="text-slate-300">Selecione um servico na secao acima para continuar.</p>
                  <button
                    type="button"
                    (click)="scrollTo('servicos')"
                    class="mt-4 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-violet-500"
                  >
                    Ir para servicos
                  </button>
                </div>
              }

              @if (step() === 'professional') {
                <div class="transition duration-300">
                  <div class="mb-6 flex items-center gap-3">
                    <button
                      type="button"
                      (click)="goBack('service')"
                      class="rounded-lg px-3 py-1.5 text-sm text-violet-300 transition hover:bg-violet-500/10"
                    >
                      Voltar
                    </button>
                    <div>
                      <h3 class="text-xl font-semibold text-white">Escolha o profissional</h3>
                      <p class="text-sm text-slate-400">Quem vai te atender?</p>
                    </div>
                  </div>
                  @if (professionalsLoading()) {
                    <p class="text-slate-400">Carregando profissionais...</p>
                  } @else if (professionals().length === 0) {
                    <p class="mt-3 text-sm text-rose-400">
                      Nenhum profissional disponivel. Cadastre profissionais em Configuracoes &gt; Profissionais
                      com a opcao "Aceita agendamentos" marcada.
                    </p>
                  } @else {
                    <div class="grid gap-3 sm:grid-cols-2">
                      @for (pro of professionals(); track pro.publicId) {
                        <button
                          type="button"
                          (click)="selectProfessional(pro)"
                          class="rounded-2xl border border-slate-800 bg-slate-900/70 px-5 py-5 text-left transition duration-300 hover:border-violet-500/40 hover:bg-slate-900"
                        >
                          <span class="font-medium text-white">{{ pro.name }}</span>
                        </button>
                      }
                    </div>
                  }
                </div>
              }

              @if (step() === 'datetime') {
                <div class="space-y-6 transition duration-300">
                  <div class="flex items-center gap-3">
                    <button
                      type="button"
                      (click)="goBack('professional')"
                      class="rounded-lg px-3 py-1.5 text-sm text-violet-300 transition hover:bg-violet-500/10"
                    >
                      Voltar
                    </button>
                    <div>
                      <h3 class="text-xl font-semibold text-white">Data e horario</h3>
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
                          [disabled]="day.isPast || !day.inMonth || day.isClosed"
                          (click)="selectDate(day)"
                          class="rounded-xl py-2.5 text-sm transition duration-200 disabled:cursor-not-allowed disabled:opacity-35"
                          [class.text-slate-600]="!day.inMonth"
                          [class.text-slate-500]="day.inMonth && (day.isPast || day.isClosed)"
                          [class.text-white]="day.inMonth && !day.isPast && !day.isClosed"
                          [class.bg-violet-600]="day.isSelected"
                          [class.shadow-md]="day.isSelected"
                          [class.shadow-violet-900/40]="day.isSelected"
                          [class.ring-1]="day.isToday && !day.isSelected && !day.isClosed"
                          [class.ring-violet-400/40]="day.isToday && !day.isSelected && !day.isClosed"
                          [class.hover:bg-slate-800]="day.inMonth && !day.isPast && !day.isClosed && !day.isSelected"
                        >
                          {{ day.date.getDate() }}
                        </button>
                      }
                    </div>
                  </div>

                  @if (selectedDate()) {
                    <div>
                      <h4 class="text-sm font-medium text-white">
                        Horarios livres em {{ formatDateLabel(selectedDate()!) }}
                      </h4>
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
                              class="rounded-xl border px-4 py-2.5 text-sm transition duration-200"
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
                </div>
              }

              @if (step() === 'confirm') {
                <div class="max-w-lg transition duration-300">
                  <div class="mb-6 flex items-center gap-3">
                    <button
                      type="button"
                      (click)="goBack('datetime')"
                      class="rounded-lg px-3 py-1.5 text-sm text-violet-300 transition hover:bg-violet-500/10"
                    >
                      Voltar
                    </button>
                    <div>
                      <h3 class="text-xl font-semibold text-white">Confirmar</h3>
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
                        class="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-violet-500"
                      />
                    </div>
                    <div>
                      <label class="mb-1 block text-sm text-slate-300">WhatsApp</label>
                      <input
                        formControlName="guestPhone"
                        appPhoneMask
                        type="tel"
                        inputmode="tel"
                        autocomplete="tel"
                        maxlength="15"
                        placeholder="(11) 99999-9999"
                        class="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-violet-500"
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
                </div>
              }
            }
          </section>

          @if (tenant()!.googleMapsUrl && (mapsPreviewImageUrl() || mapsEmbedUrl())) {
            <section
              id="endereco"
              class="page-section scroll-mt-24 border-t border-slate-800/60 py-12 md:py-16"
            >
              <h2 class="text-2xl font-semibold text-white md:text-3xl">Onde fica nosso endereco</h2>
              <p class="mt-2 text-sm text-slate-400">Veja a regiao e trace a rota ate o salao.</p>

              <div class="mt-6 overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/40">
                @if (mapsPreviewImageUrl()) {
                  <a
                    [href]="mapsOpenUrl()"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="group block"
                    aria-label="Abrir localizacao no Google Maps"
                  >
                    <img
                      [src]="mapsPreviewImageUrl()!"
                      alt="Mapa do salao"
                      class="h-56 w-full object-cover md:h-80"
                    />
                    <p
                      class="border-t border-slate-800/80 bg-slate-900/60 px-4 py-3 text-center text-sm font-medium text-violet-300 transition group-hover:text-violet-200"
                    >
                      Ver regiao no Google Maps
                    </p>
                  </a>
                } @else if (mapsEmbedUrl()) {
                  <iframe
                    [src]="mapsEmbedUrl()"
                    title="Mapa do salao"
                    loading="eager"
                    referrerpolicy="no-referrer-when-downgrade"
                    class="h-56 w-full border-0 md:h-80"
                  ></iframe>
                  <a
                    [href]="mapsOpenUrl()"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="block border-t border-slate-800/80 bg-slate-900/60 px-4 py-3 text-center text-sm font-medium text-violet-300 transition hover:text-violet-200"
                  >
                    Ver regiao no Google Maps
                  </a>
                }
              </div>
            </section>
          }

          <footer
            id="contato"
            class="page-section border-t border-slate-800/60 py-12 pb-20 md:py-16 md:pb-24"
          >
            <div class="grid gap-6 md:grid-cols-3 md:gap-8">
              <div class="scroll-mt-24">
                <h2 class="text-xl font-semibold text-white md:text-2xl">Contato</h2>
                <p class="mt-1 text-sm text-slate-400">Fale conosco pelo WhatsApp ou redes sociais.</p>

                <div class="mt-4">
                  @if (hasContactLinks()) {
                    <div class="flex flex-wrap gap-2.5">
                      @if (tenant()!.whatsapp) {
                        <a
                          [href]="whatsappLink()"
                          target="_blank"
                          rel="noopener noreferrer"
                          [title]="whatsappLinkTitle()"
                          [attr.aria-label]="whatsappLinkTitle()"
                          class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#25D366] text-white transition hover:opacity-90"
                        >
                          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path
                              d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.435 9.884-9.881 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"
                            />
                          </svg>
                        </a>
                      }
                      @if (tenant()!.instagramUrl) {
                        <a
                          [href]="tenant()!.instagramUrl"
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Instagram"
                          class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#f58529] via-[#dd2a7b] to-[#8134af] text-white transition hover:opacity-90"
                        >
                          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path
                              d="M7.8 2h8.4A5.8 5.8 0 0 1 22 7.8v8.4A5.8 5.8 0 0 1 16.2 22H7.8A5.8 5.8 0 0 1 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m0 2A3.8 3.8 0 0 0 4 7.8v8.4A3.8 3.8 0 0 0 7.8 20h8.4a3.8 3.8 0 0 0 3.8-3.8V7.8A3.8 3.8 0 0 0 16.2 4H7.8m8.65 1.5a1.15 1.15 0 1 1 0 2.3 1.15 1.15 0 0 1 0-2.3M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z"
                            />
                          </svg>
                        </a>
                      }
                      @if (tenant()!.facebookUrl) {
                        <a
                          [href]="tenant()!.facebookUrl"
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Facebook"
                          class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#1877F2] text-white transition hover:opacity-90"
                        >
                          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path
                              d="M22 12a10 10 0 1 0-11.5 9.9v-7H8v-3h2.5V9.5A3.5 3.5 0 0 1 14 6h3v3h-2a1 1 0 0 0-1 1V12H17l-.5 3h-2.5v7A10 10 0 0 0 22 12"
                            />
                          </svg>
                        </a>
                      }
                      @if (tenant()!.tiktokUrl) {
                        <a
                          [href]="tenant()!.tiktokUrl"
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="TikTok"
                          class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-black text-white transition hover:opacity-90"
                        >
                          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path
                              d="M16.6 5.82s.51.5 0 0A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.1 2.96-5.05 6.41 1.03 3.2 4.66 4.76 7.74 3.04 1.65-.89 2.76-2.66 2.76-4.58V6.9c2 .12 3.86 1.27 4.7 2.82l2.44-.9z"
                            />
                          </svg>
                        </a>
                      }
                      @if (tenant()!.youtubeUrl) {
                        <a
                          [href]="tenant()!.youtubeUrl"
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="YouTube"
                          class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#FF0000] text-white transition hover:opacity-90"
                        >
                          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </a>
                      }
                      @if (tenant()!.websiteUrl) {
                        <a
                          [href]="tenant()!.websiteUrl"
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Site"
                          class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-600 text-white transition hover:opacity-90"
                        >
                          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                          </svg>
                        </a>
                      }
                    </div>
                  } @else {
                    <p class="text-sm text-slate-500">Nenhum contato informado.</p>
                  }
                </div>
              </div>

              <div class="scroll-mt-24">
                <h2 class="text-xl font-semibold text-white md:text-2xl">Horario de funcionamento</h2>
                <p class="mt-1 text-sm text-slate-400">Quando estamos abertos.</p>

                <div class="mt-4">
                  @if (businessHoursLines().length) {
                    <div class="space-y-1.5">
                      @for (line of businessHoursLines(); track line) {
                        <p class="text-sm leading-relaxed text-slate-300">{{ line }}</p>
                      }
                    </div>
                  } @else {
                    <p class="text-sm text-slate-500">Horario nao informado.</p>
                  }
                </div>
              </div>

              <div [attr.id]="tenant()!.googleMapsUrl ? null : 'endereco'" class="scroll-mt-24">
                <h2 class="text-xl font-semibold text-white md:text-2xl">Endereco</h2>
                <p class="mt-1 text-sm text-slate-400">Venha nos visitar.</p>

                <div class="mt-4">
                  @if (tenant()!.address) {
                    <p class="text-base leading-relaxed text-slate-300">{{ tenant()!.address }}</p>
                  } @else {
                    <p class="text-sm text-slate-500">Endereco nao informado.</p>
                  }
                </div>
              </div>
            </div>
          </footer>
        }
      </main>

      @if (tenant()) {
        <nav
          class="fixed inset-x-0 bottom-0 z-40 border-t border-slate-800/80 bg-slate-950/95 backdrop-blur-xl md:hidden"
          aria-label="Navegacao principal"
        >
          <div class="flex items-stretch justify-around px-1 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
            @for (item of navSections; track item.id) {
              <button
                type="button"
                (click)="scrollTo(item.id)"
                class="flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-slate-500 transition hover:text-slate-300"
                [class.font-medium]="activeSection() === item.id"
                [class.text-violet-300]="activeSection() === item.id"
              >
                <span
                  class="flex h-6 w-6 items-center justify-center [&_.nav-icon]:h-[1.35rem] [&_.nav-icon]:w-[1.35rem]"
                >
                  <ng-container [ngTemplateOutlet]="navIcon" [ngTemplateOutletContext]="{ icon: item.icon }" />
                </span>
                <span class="w-full truncate text-center text-[10px] leading-tight">{{ item.mobileLabel }}</span>
              </button>
            }
          </div>
        </nav>
      }
    </div>

    <ng-template #navIcon let-icon="icon">
      @switch (icon) {
        @case ('home') {
          <svg class="nav-icon h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
        }
        @case ('services') {
          <svg class="nav-icon h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6Z" />
          </svg>
        }
        @case ('calendar') {
          <svg class="nav-icon h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
          </svg>
        }
        @case ('map') {
          <svg class="nav-icon h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
          </svg>
        }
        @case ('contact') {
          <svg class="nav-icon h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
          </svg>
        }
      }
    </ng-template>
  `,
})
export class PublicSalonComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly publicSalon = inject(PublicSalonService);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly fb = inject(FormBuilder);
  private readonly sanitizer = inject(DomSanitizer);

  protected readonly weekdayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

  protected readonly genderTabs: ServiceGender[] = ['feminino', 'masculino'];

  protected readonly navSections: NavSection[] = [
    { id: 'inicio', label: 'Quem somos', mobileLabel: 'Inicio', icon: 'home' },
    { id: 'servicos', label: 'Servicos', mobileLabel: 'Servicos', icon: 'services' },
    { id: 'agenda', label: 'Agenda', mobileLabel: 'Agenda', icon: 'calendar' },
    { id: 'endereco', label: 'Endereco', mobileLabel: 'Mapa', icon: 'map' },
    { id: 'contato', label: 'Contato', mobileLabel: 'Contato', icon: 'contact' },
  ];

  protected readonly activeSection = signal('inicio');

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
  protected readonly openDaysOfWeek = signal<number[]>([]);
  protected readonly selectedDate = signal<string | null>(null);
  protected readonly selectedSlot = signal<AvailabilitySlot | null>(null);
  protected readonly confirmation = signal<BookingConfirmation | null>(null);

  protected readonly calendarMonth = signal(this.startOfMonth(new Date()));

  protected readonly guestForm = this.fb.nonNullable.group({
    guestName: ['', [Validators.required, Validators.minLength(2)]],
    guestPhone: [
      '',
      [
        Validators.required,
        (control: AbstractControl) =>
          isValidBrazilianPhone(String(control.value ?? '')) ? null : { phone: true },
      ],
    ],
  });

  private slug = '';
  private sectionObserver?: IntersectionObserver;

  protected readonly calendarDays = computed(() => this.buildCalendarDays());
  protected readonly monthLabel = computed(() =>
    new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(this.calendarMonth())
  );

  protected readonly activeGenderTab = signal<ServiceGender>('feminino');

  protected readonly aboutText = computed(() => {
    const tenant = this.tenant();
    const description = tenant?.description?.trim();
    if (description) {
      return description;
    }
    return `Somos o ${tenant?.name ?? 'salao'}, prontos para cuidar do seu visual com atendimento personalizado e agendamento online rapido.`;
  });

  protected readonly activeTabServices = computed(() => {
    const tab = this.activeGenderTab();
    return this.services().filter((service) => serviceGroupGender(service.gender) === tab);
  });

  protected readonly mapsEmbedUrl = computed((): SafeResourceUrl | null => {
    const tenant = this.tenant();
    if (!tenant?.googleMapsUrl) {
      return null;
    }
    const url = buildGoogleMapsEmbedUrl(tenant.googleMapsUrl, tenant.address);
    return url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null;
  });

  protected readonly mapsPreviewImageUrl = computed((): string | null => {
    const tenant = this.tenant();
    if (!tenant?.googleMapsUrl) {
      return null;
    }
    const coords = extractMapCoordinates(tenant.googleMapsUrl, tenant.address);
    if (!coords) {
      return null;
    }
    return buildOsmStaticMapUrl(coords.lat, coords.lng);
  });

  protected readonly mapsOpenUrl = computed((): string => {
    const tenant = this.tenant();
    if (!tenant) {
      return '#';
    }
    return buildGoogleMapsOpenUrl(tenant.googleMapsUrl, tenant.address) ?? '#';
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
        this.syncGenderTab(services);
        this.applySeo(tenant);
        this.loading.set(false);
        queueMicrotask(() => this.setupSectionObserver());
      },
      error: () => {
        this.error.set('Salao nao encontrado ou indisponivel.');
        this.loading.set(false);
      },
    });
  }

  protected genderLabel(gender: ServiceGender): string {
    return serviceGenderLabel(gender);
  }

  protected formatPhoneDisplay = formatPhoneDisplay;

  ngOnDestroy(): void {
    this.sectionObserver?.disconnect();
  }

  protected scrollTo(sectionId: string): void {
    this.activeSection.set(sectionId);
    scrollToSection(sectionId);
  }

  protected serviceImage(service: PublicService): string {
    return resolveServiceImageUrl(service.name, service.description, service.imageUrl);
  }

  protected setGenderTab(gender: ServiceGender): void {
    this.activeGenderTab.set(gender);
  }

  protected serviceGender(service: PublicService): ServiceGender {
    return serviceGroupGender(service.gender);
  }

  protected isStepActive(step: BookingStep): boolean {
    return this.step() === step;
  }

  protected isStepComplete(step: BookingStep): boolean {
    const order: BookingStep[] = ['service', 'professional', 'datetime', 'confirm', 'done'];
    return order.indexOf(this.step()) > order.indexOf(step);
  }

  protected hasContactLinks(): boolean {
    const tenant = this.tenant();
    if (!tenant) return false;
    return !!(
      tenant.whatsapp ||
      tenant.instagramUrl ||
      tenant.facebookUrl ||
      tenant.tiktokUrl ||
      tenant.youtubeUrl ||
      tenant.websiteUrl
    );
  }

  protected whatsappLink(): string {
    const tenant = this.tenant();
    const phone = tenant?.whatsapp ?? '';
    if (!phone) {
      return '#';
    }
    const salonName = tenant?.name?.trim() || 'nosso salao';
    return buildWhatsAppUrl(
      phone,
      `Ola! Vim pelo site do ${salonName} e gostaria de saber mais sobre os servicos. Pode me ajudar?`
    );
  }

  protected whatsappLinkTitle(): string {
    const salonName = this.tenant()?.name?.trim() || 'Salao';
    return `Fale com ${salonName} no WhatsApp`;
  }

  protected businessHoursLines(): string[] {
    return this.tenant()?.businessHoursLines ?? [];
  }

  protected selectService(service: PublicService): void {
    this.selectedService.set(service);
    this.selectedProfessional.set(null);
    this.selectedDate.set(null);
    this.selectedSlot.set(null);
    this.slots.set([]);
    this.step.set('professional');
    this.loadProfessionals();
    scrollToSection('agenda');
  }

  protected selectProfessional(pro: PublicProfessional): void {
    this.selectedProfessional.set(pro);
    this.openDaysOfWeek.set(pro.openDaysOfWeek ?? []);
    this.selectedDate.set(null);
    this.selectedSlot.set(null);
    this.slots.set([]);
    this.step.set('datetime');
  }

  protected confirmationClientWhatsAppUrl(): string {
    const confirmation = this.confirmation();
    if (!confirmation) {
      return '#';
    }
    return buildWhatsAppUrl(confirmation.guestPhone, this.buildConfirmationMessage(confirmation));
  }

  protected confirmationProfessionalWhatsAppUrl(): string {
    const confirmation = this.confirmation();
    if (!confirmation?.professionalPhone) {
      return '#';
    }
    return buildWhatsAppUrl(
      confirmation.professionalPhone,
      this.buildProfessionalNotificationMessage(confirmation)
    );
  }

  protected selectDate(day: CalendarDay): void {
    if (day.isPast || !day.inMonth || day.isClosed) return;
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
    if (target === 'service') {
      scrollToSection('servicos');
    }
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
    const normalizedPhone = normalizePhoneValue(guestPhone) ?? guestPhone;

    this.publicSalon
      .createGuestAppointment(this.slug, {
        servicePublicId: service.publicId,
        professionalPublicId: professional.publicId,
        startAt: slot.startAt,
        guestName,
        guestPhone: normalizedPhone,
      })
      .subscribe({
        next: (response) => {
          this.booking.set(false);
          this.confirmation.set({
            guestName: response.guestName,
            guestPhone: normalizedPhone,
            startAt: response.startAt,
            endAt: response.endAt,
            serviceName: service.name,
            serviceDurationMinutes: service.durationMinutes,
            servicePrice: service.price,
            professionalName: professional.name,
            professionalPhone: professional.phone,
            salonName: this.tenant()?.name ?? 'Salao',
          });
          this.step.set('done');
          scrollToSection('agenda');
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
    scrollToSection('servicos');
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

  protected formatTimeRange(startAt: string, endAt: string): string {
    const start = this.formatSlotTime(startAt);
    const end = this.formatSlotTime(endAt);
    return `${start} – ${end}`;
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
    const openDays = this.openDaysOfWeek();
    const days: CalendarDay[] = [];

    for (let i = 0; i < 42; i++) {
      const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
      const key = this.toIsoDate(date);
      const isPast = key < todayKey;
      const backendDay = this.backendDayOfWeek(date);
      const isClosed = openDays.length > 0 && !openDays.includes(backendDay);
      days.push({
        date,
        key,
        inMonth: date.getMonth() === month,
        isToday: key === todayKey,
        isSelected: selected === key,
        isPast,
        isClosed,
      });
    }

    return days;
  }

  private syncGenderTab(services: PublicService[]): void {
    const hasFeminino = services.some((service) => serviceGroupGender(service.gender) === 'feminino');
    const hasMasculino = services.some((service) => serviceGroupGender(service.gender) === 'masculino');
    if (hasFeminino) {
      this.activeGenderTab.set('feminino');
    } else if (hasMasculino) {
      this.activeGenderTab.set('masculino');
    }
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

  private backendDayOfWeek(date: Date): number {
    const jsDay = date.getDay();
    return jsDay === 0 ? 7 : jsDay;
  }

  private buildConfirmationMessage(confirmation: BookingConfirmation): string {
    return (
      `Ola! Meu agendamento no ${confirmation.salonName} foi confirmado.\n\n` +
      `Servico: ${confirmation.serviceName}\n` +
      `Profissional: ${confirmation.professionalName}\n` +
      `Horario: ${this.formatSlotLabel(confirmation.startAt)} (${this.formatTimeRange(confirmation.startAt, confirmation.endAt)})\n` +
      `Duracao: ${confirmation.serviceDurationMinutes} min\n` +
      `Valor: ${this.formatCurrency(confirmation.servicePrice)}`
    );
  }

  private buildProfessionalNotificationMessage(confirmation: BookingConfirmation): string {
    return (
      `Ola ${confirmation.professionalName}! Novo agendamento no ${confirmation.salonName}.\n\n` +
      `Cliente: ${confirmation.guestName}\n` +
      `WhatsApp: ${confirmation.guestPhone}\n` +
      `Servico: ${confirmation.serviceName}\n` +
      `Horario: ${this.formatSlotLabel(confirmation.startAt)} (${this.formatTimeRange(confirmation.startAt, confirmation.endAt)})`
    );
  }

  private setupSectionObserver(): void {
    this.sectionObserver?.disconnect();

    const visibleSections = this.navSections
      .map((section) => {
        const element = document.getElementById(section.id);
        return element ? { id: section.id, element } : null;
      })
      .filter((section): section is { id: string; element: HTMLElement } => section !== null);

    if (visibleSections.length === 0) {
      return;
    }

    this.sectionObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible.length > 0) {
          this.activeSection.set(visible[0].target.id);
        }
      },
      {
        root: null,
        rootMargin: '-40% 0px -45% 0px',
        threshold: [0, 0.15, 0.35, 0.55],
      }
    );

    for (const section of visibleSections) {
      this.sectionObserver.observe(section.element);
    }
  }
}
