import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
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
import { scrollToSection } from '../../core/utils/scroll.util';
import {
  formatPhoneInput,
  isValidBrazilianPhone,
} from '../../core/utils/phone.util';
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
};

type StepItem = { id: BookingStep; label: string; number: number };

type NavSection = { id: string; label: string };

@Component({
  selector: 'app-public-salon',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="app-view min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-violet-950/20 text-slate-100">
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
              class="ml-auto flex max-w-full items-center gap-1 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              aria-label="Navegacao principal"
            >
              @for (item of navSections; track item.id) {
                <button
                  type="button"
                  (click)="scrollTo(item.id)"
                  class="shrink-0 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-400 transition hover:bg-slate-800/80 hover:text-white md:px-3 md:text-sm"
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
                          [disabled]="day.isPast || !day.inMonth"
                          (click)="selectDate(day)"
                          class="rounded-xl py-2.5 text-sm transition duration-200"
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
                        type="tel"
                        inputmode="tel"
                        autocomplete="tel"
                        maxlength="15"
                        placeholder="(11) 99999-9999"
                        (input)="onGuestPhoneInput($event)"
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

          <footer
            id="contato"
            class="page-section border-t border-slate-800/60 py-12 pb-20 md:py-16 md:pb-24"
          >
            <div class="grid gap-6 md:grid-cols-2 md:gap-8">
              <div class="scroll-mt-24">
                <h2 class="text-xl font-semibold text-white md:text-2xl">Contato</h2>
                <p class="mt-1 text-sm text-slate-400">Fale conosco pelo WhatsApp ou redes sociais.</p>

                <div class="mt-4 rounded-2xl border border-slate-800/80 bg-slate-900/40 p-5 md:p-6">
                  @if (tenant()!.whatsapp) {
                    <p class="text-sm text-slate-300">
                      <span class="font-medium text-white">WhatsApp:</span>
                      <a
                        [href]="whatsappLink()"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="ml-1 text-violet-300 transition hover:text-violet-200"
                      >
                        {{ formatPhoneInput(tenant()!.whatsapp!) }}
                      </a>
                    </p>
                  } @else {
                    <p class="text-sm text-slate-500">WhatsApp nao informado.</p>
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
                    </div>
                  }
                </div>
              </div>

              <div id="endereco" class="scroll-mt-24">
                <h2 class="text-xl font-semibold text-white md:text-2xl">Endereco</h2>
                <p class="mt-1 text-sm text-slate-400">Venha nos visitar.</p>

                <div class="mt-4 rounded-2xl border border-slate-800/80 bg-slate-900/40 p-5 md:p-6">
                  @if (tenant()!.address) {
                    <p class="text-base leading-relaxed text-slate-300">{{ tenant()!.address }}</p>
                  } @else {
                    <p class="text-sm text-slate-500">Endereco nao informado.</p>
                  }

                  @if (tenant()!.googleMapsUrl) {
                    <a
                      [href]="tenant()!.googleMapsUrl"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="mt-4 inline-flex rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-violet-500"
                    >
                      Como chegar
                    </a>
                  }
                </div>
              </div>
            </div>
          </footer>
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

  protected readonly genderTabs: ServiceGender[] = ['feminino', 'masculino'];

  protected readonly navSections: NavSection[] = [
    { id: 'inicio', label: 'Quem somos' },
    { id: 'servicos', label: 'Servicos' },
    { id: 'agenda', label: 'Agenda' },
    { id: 'endereco', label: 'Endereco' },
    { id: 'contato', label: 'Contato' },
  ];

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

  protected formatPhoneInput = formatPhoneInput;

  protected onGuestPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const formatted = formatPhoneInput(input.value);
    input.value = formatted;
    this.guestForm.controls.guestPhone.setValue(formatted, { emitEvent: false });
  }

  protected scrollTo(sectionId: string): void {
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

  protected hasSocialLinks(): boolean {
    const tenant = this.tenant();
    if (!tenant) return false;
    return !!(
      tenant.instagramUrl ||
      tenant.facebookUrl ||
      tenant.tiktokUrl ||
      tenant.websiteUrl
    );
  }

  protected whatsappLink(): string {
    const raw = this.tenant()?.whatsapp?.replace(/\D/g, '') ?? '';
    if (!raw) {
      return '#';
    }
    return `https://wa.me/${raw}`;
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
    const normalizedPhone = formatPhoneInput(guestPhone);

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
          this.confirmation.set({ guestName: response.guestName, startAt: response.startAt });
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
}
