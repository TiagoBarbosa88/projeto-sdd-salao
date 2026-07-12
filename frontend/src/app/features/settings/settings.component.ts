import { Component, computed, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthService, MeResponse } from '../../core/services/auth.service';
import { PhoneMaskDirective } from '../../core/directives/phone-mask.directive';
import {
  BlockedPeriod,
  BlockType,
  ScheduleService,
  WorkingPeriodEntry,
} from '../../core/services/schedule.service';
import {
  SalonSettings,
  SchedulingSettings,
  SettingsService,
} from '../../core/services/settings.service';
import {
  CreateTeamMember,
  Professional,
  TeamMember,
  TeamRole,
  TeamService,
} from '../../core/services/team.service';
import { readImageAsDataUrl } from '../../core/utils/image-file.util';
import {
  formatPhoneDisplay,
  normalizePhoneValue,
  optionalPhoneValidator,
} from '../../core/utils/phone.util';
import { roleLabel } from '../../core/utils/team.util';

type SettingsTab = 'personalization' | 'social' | 'funcionamento' | 'professionals' | 'agenda' | 'account';

const WEEKDAYS: { value: number; label: string }[] = [
  { value: 1, label: 'Segunda' },
  { value: 2, label: 'Terca' },
  { value: 3, label: 'Quarta' },
  { value: 4, label: 'Quinta' },
  { value: 5, label: 'Sexta' },
  { value: 6, label: 'Sabado' },
  { value: 7, label: 'Domingo' },
];

type DayScheduleRow = {
  dayOfWeek: number;
  label: string;
  enabled: boolean;
  startTime: string;
  endTime: string;
  lunchEnabled: boolean;
  lunchStart: string;
  lunchEnd: string;
};

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, PhoneMaskDirective],
  template: `
    <div class="space-y-6">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start">
        <nav
          class="flex gap-2 overflow-x-auto rounded-xl border border-slate-800 bg-slate-900 p-2 lg:w-56 lg:flex-col lg:overflow-visible"
          aria-label="Abas de configuracao"
        >
          @for (tab of visibleTabs(); track tab.id) {
            <button
              type="button"
              (click)="setTab(tab.id)"
              class="shrink-0 rounded-lg px-4 py-2.5 text-left text-sm font-medium transition"
              [class.bg-violet-600]="activeTab() === tab.id"
              [class.text-white]="activeTab() === tab.id"
              [class.text-slate-400]="activeTab() !== tab.id"
              [class.hover:bg-slate-800]="activeTab() !== tab.id"
            >
              {{ tab.label }}
            </button>
          }
        </nav>

        <div class="min-w-0 flex-1 space-y-4">
          @if (banner()) {
            <p
              class="rounded-lg px-4 py-3 text-sm"
              [class.bg-emerald-500/10]="banner()!.type === 'success'"
              [class.text-emerald-300]="banner()!.type === 'success'"
              [class.bg-rose-500/10]="banner()!.type === 'error'"
              [class.text-rose-300]="banner()!.type === 'error'"
            >
              {{ banner()!.message }}
            </p>
          }

          @if (activeTab() === 'personalization' && isAdmin()) {
            <section class="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <h2 class="text-xl font-semibold text-white">Personalizacao</h2>
              <p class="mt-1 text-sm text-slate-400">
                Como seu salao aparece na pagina publica de agendamento.
              </p>

              @if (salonLoading()) {
                <p class="mt-6 text-slate-400">Carregando...</p>
              } @else {
                <form class="mt-6 space-y-4" [formGroup]="personalizationForm" (ngSubmit)="savePersonalization()">
                  <div class="grid gap-4 md:grid-cols-2">
                    <div>
                      <label class="mb-1 block text-sm text-slate-300">Nome do salao</label>
                      <input
                        formControlName="name"
                        class="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-violet-500"
                      />
                    </div>
                    <div class="md:col-span-2 rounded-lg border border-slate-800 bg-slate-950/50 p-4">
                      <p class="text-sm font-medium text-slate-300">Pagina publica</p>
                      <p class="mt-2 text-xs leading-relaxed text-slate-500">
                        Ao publicar na Vercel, seus clientes acessam pelo dominio que voce configurar
                        (ex:
                        <span class="text-slate-400">meusalao.vercel.app</span>).
                        O identificador interno do salao e
                        <span class="text-slate-400">{{ salonSettings()?.slug }}</span>.
                      </p>
                    </div>
                    <div class="md:col-span-2">
                      <label class="mb-1 block text-sm text-slate-300">Descricao</label>
                      <textarea
                        formControlName="description"
                        rows="3"
                        class="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-violet-500"
                      ></textarea>
                    </div>
                    <div>
                      <label class="mb-1 block text-sm text-slate-300">Telefone</label>
                      <input
                        formControlName="phone"
                        appPhoneMask
                        type="tel"
                        inputmode="tel"
                        autocomplete="tel"
                        maxlength="15"
                        placeholder="(11) 3333-4444"
                        class="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-violet-500"
                      />
                    </div>
                    <div>
                      <label class="mb-1 block text-sm text-slate-300">WhatsApp</label>
                      <input
                        formControlName="whatsapp"
                        appPhoneMask
                        type="tel"
                        inputmode="tel"
                        autocomplete="tel"
                        maxlength="15"
                        placeholder="(11) 99999-9999"
                        class="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-violet-500"
                      />
                    </div>
                    <div class="md:col-span-2">
                      <label class="mb-1 block text-sm text-slate-300">Endereco</label>
                      <input
                        formControlName="address"
                        class="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-violet-500"
                      />
                    </div>
                    <div class="md:col-span-2">
                      <label class="mb-1 block text-sm text-slate-300">Logo do salao</label>
                      <div class="flex flex-wrap items-center gap-4">
                        @if (logoPreview()) {
                          <img
                            [src]="logoPreview()"
                            alt="Logo do salao"
                            class="h-20 w-20 rounded-2xl border border-slate-700 object-cover"
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
                            (change)="onLogoSelected($event)"
                          />
                        </label>
                      </div>
                      @if (logoUploadError()) {
                        <p class="mt-2 text-sm text-rose-400">{{ logoUploadError() }}</p>
                      }
                    </div>
                  </div>

                  <button
                    type="submit"
                    [disabled]="personalizationForm.invalid || salonSaving()"
                    class="rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
                  >
                    {{ salonSaving() ? 'Salvando...' : 'Salvar personalizacao' }}
                  </button>
                </form>
              }
            </section>
          }

          @if (activeTab() === 'social' && isAdmin()) {
            <section class="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <h2 class="text-xl font-semibold text-white">Redes e presenca online</h2>
              <p class="mt-1 text-sm text-slate-400">
                Links exibidos como icones no rodape da pagina publica. Cores oficiais de cada rede.
              </p>

              @if (salonLoading()) {
                <p class="mt-6 text-slate-400">Carregando...</p>
              } @else {
                <form class="mt-6 space-y-4" [formGroup]="socialForm" (ngSubmit)="saveSocial()">
                  <div class="grid gap-4 md:grid-cols-2">
                    <div>
                      <label class="mb-1 block text-sm text-slate-300">Instagram</label>
                      <input
                        formControlName="instagramUrl"
                        placeholder="https://instagram.com/seusalao"
                        class="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-violet-500"
                      />
                    </div>
                    <div>
                      <label class="mb-1 block text-sm text-slate-300">Facebook</label>
                      <input
                        formControlName="facebookUrl"
                        placeholder="https://facebook.com/seusalao"
                        class="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-violet-500"
                      />
                    </div>
                    <div>
                      <label class="mb-1 block text-sm text-slate-300">TikTok</label>
                      <input
                        formControlName="tiktokUrl"
                        placeholder="https://tiktok.com/@seusalao"
                        class="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-violet-500"
                      />
                    </div>
                    <div>
                      <label class="mb-1 block text-sm text-slate-300">Site</label>
                      <input
                        formControlName="websiteUrl"
                        placeholder="https://seusalao.com.br"
                        class="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-violet-500"
                      />
                    </div>
                    <div>
                      <label class="mb-1 block text-sm text-slate-300">YouTube</label>
                      <input
                        formControlName="youtubeUrl"
                        placeholder="https://youtube.com/@seusalao"
                        class="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-violet-500"
                      />
                    </div>
                    <div class="md:col-span-2">
                      <label class="mb-1 block text-sm text-slate-300">Google Maps</label>
                      <input
                        formControlName="googleMapsUrl"
                        placeholder="https://maps.google.com/..."
                        class="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-violet-500"
                      />
                      <p class="mt-1 text-xs text-slate-500">
                        Exibe o mapa na pagina publica com o titulo "Onde fica nosso endereco".
                      </p>
                    </div>
                  </div>

                  <button
                    type="submit"
                    [disabled]="socialSaving()"
                    class="rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
                  >
                    {{ socialSaving() ? 'Salvando...' : 'Salvar redes' }}
                  </button>
                </form>
              }
            </section>
          }

          @if (activeTab() === 'funcionamento' && isAdmin()) {
            <section class="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <h2 class="text-xl font-semibold text-white">Horario de funcionamento</h2>
              <p class="mt-1 text-sm text-slate-400">
                Horario publico exibido no rodape da pagina inicial. Para escala semanal por profissional, use a aba Agenda.
              </p>

              @if (salonLoading()) {
                <p class="mt-6 text-slate-400">Carregando...</p>
              } @else if (schedulingSettings()) {
                <form
                  class="mt-6 space-y-4"
                  [formGroup]="schedulingForm"
                  (ngSubmit)="saveScheduling()"
                >
                  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <label class="mb-1 block text-sm text-slate-300">Fuso horario</label>
                      <input formControlName="zoneId" class="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-violet-500" />
                    </div>
                    <div>
                      <label class="mb-1 block text-sm text-slate-300">Inicio do dia</label>
                      <input type="time" formControlName="dayStartTime" class="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-violet-500" />
                    </div>
                    <div>
                      <label class="mb-1 block text-sm text-slate-300">Fim do dia</label>
                      <input type="time" formControlName="dayEndTime" class="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-violet-500" />
                    </div>
                    <div>
                      <label class="mb-1 block text-sm text-slate-300">Pausa entre atendimentos (min)</label>
                      <input type="number" formControlName="bufferMinutes" min="0" class="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-violet-500" />
                    </div>
                    <div>
                      <label class="mb-1 block text-sm text-slate-300">Intervalo de slots (min)</label>
                      <input type="number" formControlName="slotIntervalMinutes" min="5" class="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-violet-500" />
                    </div>
                  </div>
                  <button type="submit" [disabled]="schedulingForm.invalid || schedulingSaving()" class="rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50">
                    {{ schedulingSaving() ? 'Salvando...' : 'Salvar horario' }}
                  </button>
                </form>
              }
            </section>
          }

          @if (activeTab() === 'professionals' && isAdmin()) {
            <section class="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <div class="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 class="text-xl font-semibold text-white">Profissionais</h2>
                  <p class="mt-1 text-sm text-slate-400">Gerencie quem pode receber agendamentos.</p>
                </div>
                <button
                  type="button"
                  (click)="toggleMemberForm()"
                  class="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500"
                >
                  {{ showMemberForm() ? 'Cancelar' : 'Novo profissional' }}
                </button>
              </div>

              @if (showMemberForm()) {
                <form class="mt-6 space-y-4 rounded-lg border border-slate-800 bg-slate-950/50 p-4" [formGroup]="memberForm" (ngSubmit)="createMember()">
                  <div class="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label class="mb-1 block text-sm text-slate-300">Nome</label>
                      <input formControlName="name" class="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-violet-500" />
                    </div>
                    <div>
                      <label class="mb-1 block text-sm text-slate-300">Email</label>
                      <input type="email" formControlName="email" class="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-violet-500" />
                    </div>
                    <div>
                      <label class="mb-1 block text-sm text-slate-300">Senha inicial</label>
                      <input type="password" formControlName="password" class="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-violet-500" />
                    </div>
                    <div>
                      <label class="mb-1 block text-sm text-slate-300">Telefone</label>
                      <input
                        formControlName="phone"
                        appPhoneMask
                        type="tel"
                        inputmode="tel"
                        autocomplete="tel"
                        maxlength="15"
                        placeholder="(11) 99999-9999"
                        class="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-violet-500"
                      />
                    </div>
                  </div>
                  <label class="flex items-center gap-2 text-sm text-slate-300">
                    <input type="checkbox" formControlName="bookable" class="rounded border-slate-700 bg-slate-950 text-violet-600" />
                    Aceita agendamentos
                  </label>
                  <button type="submit" [disabled]="memberForm.invalid || memberSaving()" class="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50">
                    {{ memberSaving() ? 'Criando...' : 'Criar profissional' }}
                  </button>
                </form>
              }

              @if (professionalsLoading()) {
                <p class="mt-6 text-slate-400">Carregando profissionais...</p>
              } @else if (professionals().length === 0) {
                <p class="mt-6 text-slate-400">Nenhum profissional cadastrado.</p>
              } @else {
                <div class="mt-6 space-y-3">
                  @for (pro of professionals(); track pro.publicId) {
                    <article class="rounded-lg border border-slate-800 bg-slate-950/40 p-4">
                      @if (editingMemberId() === pro.publicId) {
                        <form class="space-y-4" [formGroup]="editMemberForm" (ngSubmit)="saveEditMember()">
                          <div class="grid gap-4 sm:grid-cols-2">
                            <div>
                              <label class="mb-1 block text-sm text-slate-300">Nome</label>
                              <input formControlName="name" class="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-violet-500" />
                            </div>
                            <div>
                              <label class="mb-1 block text-sm text-slate-300">Telefone</label>
                              <input
                                formControlName="phone"
                                appPhoneMask
                                type="tel"
                                inputmode="tel"
                                maxlength="15"
                                placeholder="(11) 99999-9999"
                                class="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-violet-500"
                              />
                            </div>
                            <div>
                              <label class="mb-1 block text-sm text-slate-300">Funcao</label>
                              <select formControlName="role" class="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-violet-500">
                                @for (option of roleOptions; track option.value) {
                                  <option [value]="option.value">{{ option.label }}</option>
                                }
                              </select>
                            </div>
                            <div>
                              <label class="mb-1 block text-sm text-slate-300">Nova senha (opcional)</label>
                              <input type="password" formControlName="password" placeholder="Minimo 8 caracteres" class="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-violet-500" />
                            </div>
                          </div>
                          <div class="flex flex-wrap gap-4">
                            <label class="flex items-center gap-2 text-sm text-slate-300">
                              <input type="checkbox" formControlName="bookable" class="rounded border-slate-700 bg-slate-950 text-violet-600" />
                              Aceita agendamentos
                            </label>
                            <label class="flex items-center gap-2 text-sm text-slate-300">
                              <input type="checkbox" formControlName="active" class="rounded border-slate-700 bg-slate-950 text-violet-600" />
                              Perfil ativo
                            </label>
                            <label class="flex items-center gap-2 text-sm text-slate-300">
                              <input type="checkbox" formControlName="loginActive" class="rounded border-slate-700 bg-slate-950 text-violet-600" />
                              Acesso ao sistema
                            </label>
                          </div>
                          <div class="flex flex-wrap gap-2">
                            <button type="submit" [disabled]="editMemberForm.invalid || editMemberSaving()" class="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50">
                              {{ editMemberSaving() ? 'Salvando...' : 'Salvar alteracoes' }}
                            </button>
                            <button type="button" (click)="cancelEditMember()" class="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:text-white">
                              Cancelar
                            </button>
                          </div>
                        </form>
                      } @else {
                        <div class="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h3 class="font-medium text-white">{{ pro.name }}</h3>
                            <p class="text-sm text-slate-400">{{ pro.email }}</p>
                            <p class="text-sm text-slate-400">{{ formatPhoneDisplay(pro.phone) || 'Sem telefone' }}</p>
                          </div>
                          <div class="flex flex-wrap gap-2 text-xs">
                            <span class="rounded-full bg-slate-800 px-2 py-1 text-slate-300">{{ roleLabel(pro.role) }}</span>
                            <span class="rounded-full px-2 py-1" [class.bg-emerald-500/15]="pro.active" [class.text-emerald-300]="pro.active" [class.bg-slate-700]="!pro.active" [class.text-slate-400]="!pro.active">
                              {{ pro.active ? 'Ativo' : 'Inativo' }}
                            </span>
                            <span class="rounded-full px-2 py-1" [class.bg-violet-500/15]="pro.bookable" [class.text-violet-300]="pro.bookable" [class.bg-slate-700]="!pro.bookable" [class.text-slate-400]="!pro.bookable">
                              {{ pro.bookable ? 'Agendavel' : 'Nao agendavel' }}
                            </span>
                            <span class="rounded-full px-2 py-1" [class.bg-sky-500/15]="pro.loginActive" [class.text-sky-300]="pro.loginActive" [class.bg-rose-500/15]="!pro.loginActive" [class.text-rose-300]="!pro.loginActive">
                              {{ pro.loginActive ? 'Com acesso' : 'Sem acesso' }}
                            </span>
                          </div>
                        </div>
                        <div class="mt-4 flex flex-wrap gap-2">
                          <button type="button" (click)="startEditMember(pro)" class="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300 transition hover:border-violet-500 hover:text-white">
                            Editar
                          </button>
                        </div>
                      }
                    </article>
                  }
                </div>
              }
            </section>
          }

          @if (activeTab() === 'agenda' && isAdmin()) {
            <section class="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <h2 class="text-xl font-semibold text-white">Agenda do profissional</h2>
              <p class="mt-1 text-sm text-slate-400">Horarios semanais, pausa e bloqueios.</p>

              <div class="mt-6">
                <label class="mb-1 block text-sm text-slate-300">Profissional</label>
                <select
                  [value]="selectedProfessionalId() ?? ''"
                  (change)="onProfessionalChange($event)"
                  class="w-full max-w-md rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-violet-500"
                >
                  <option value="">Selecione...</option>
                  @for (pro of professionals(); track pro.publicId) {
                    <option [value]="pro.publicId">{{ pro.name }}</option>
                  }
                </select>
              </div>

              @if (selectedProfessionalId()) {
                @if (scheduleLoading()) {
                  <p class="mt-6 text-slate-400">Carregando agenda...</p>
                } @else {
                  <div class="mt-6 space-y-3">
                    @for (row of dayRows(); track row.dayOfWeek) {
                      <div class="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
                        <div class="flex flex-wrap items-center gap-3">
                          <label class="flex w-28 items-center gap-2 text-sm text-slate-300">
                            <input type="checkbox" [checked]="row.enabled" (change)="toggleDay(row.dayOfWeek, $event)" />
                            {{ row.label }}
                          </label>
                          <input
                            type="time"
                            [value]="row.startTime"
                            [disabled]="!row.enabled"
                            (change)="updateDayTime(row.dayOfWeek, 'startTime', $event)"
                            class="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white disabled:opacity-40"
                          />
                          <span class="text-slate-500">ate</span>
                          <input
                            type="time"
                            [value]="row.endTime"
                            [disabled]="!row.enabled"
                            (change)="updateDayTime(row.dayOfWeek, 'endTime', $event)"
                            class="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white disabled:opacity-40"
                          />
                        </div>
                        @if (row.enabled) {
                          <div class="mt-3 flex flex-wrap items-center gap-3 border-t border-slate-800/80 pt-3 pl-0 sm:pl-[7.5rem]">
                            <label class="flex items-center gap-2 text-sm text-slate-300">
                              <input
                                type="checkbox"
                                [checked]="row.lunchEnabled"
                                (change)="toggleLunch(row.dayOfWeek, $event)"
                              />
                              Almoco
                            </label>
                            @if (row.lunchEnabled) {
                              <input
                                type="time"
                                [value]="row.lunchStart"
                                (change)="updateDayTime(row.dayOfWeek, 'lunchStart', $event)"
                                class="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                              />
                              <span class="text-slate-500">ate</span>
                              <input
                                type="time"
                                [value]="row.lunchEnd"
                                (change)="updateDayTime(row.dayOfWeek, 'lunchEnd', $event)"
                                class="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                              />
                            }
                          </div>
                        }
                      </div>
                    }
                  </div>

                  <button
                    type="button"
                    (click)="saveWorkingHours()"
                    [disabled]="scheduleSaving()"
                    class="mt-4 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
                  >
                    {{ scheduleSaving() ? 'Salvando...' : 'Salvar horarios' }}
                  </button>

                  <div class="mt-8 border-t border-slate-800 pt-8">
                    <h3 class="text-lg font-semibold text-white">Ferias e bloqueios</h3>
                    <form class="mt-4 grid gap-4 md:grid-cols-2" [formGroup]="blockForm" (ngSubmit)="createBlock()">
                      <div>
                        <label class="mb-1 block text-sm text-slate-300">Inicio</label>
                        <input type="datetime-local" formControlName="startAt" class="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-violet-500" />
                      </div>
                      <div>
                        <label class="mb-1 block text-sm text-slate-300">Fim</label>
                        <input type="datetime-local" formControlName="endAt" class="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-violet-500" />
                      </div>
                      <div>
                        <label class="mb-1 block text-sm text-slate-300">Tipo</label>
                        <select formControlName="blockType" class="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-violet-500">
                          <option value="VACATION">Ferias</option>
                          <option value="BREAK">Pausa / Almoco</option>
                          <option value="OTHER">Outro</option>
                        </select>
                      </div>
                      <div>
                        <label class="mb-1 block text-sm text-slate-300">Motivo</label>
                        <input formControlName="reason" class="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-violet-500" />
                      </div>
                      <div class="md:col-span-2">
                        <button type="submit" [disabled]="blockForm.invalid || blockSaving()" class="rounded-lg border border-violet-500/40 px-4 py-2.5 text-sm font-medium text-violet-300 hover:bg-violet-500/10 disabled:opacity-50">
                          {{ blockSaving() ? 'Salvando...' : 'Adicionar bloqueio' }}
                        </button>
                      </div>
                    </form>

                    @if (blockedPeriods().length === 0) {
                      <p class="mt-4 text-sm text-slate-400">Nenhum bloqueio cadastrado.</p>
                    } @else {
                      <ul class="mt-4 space-y-2">
                        @for (block of blockedPeriods(); track block.publicId) {
                          <li class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/40 px-4 py-3 text-sm">
                            <div>
                              <p class="font-medium text-white">{{ blockTypeLabel(block.blockType) }}</p>
                              <p class="text-slate-400">{{ formatBlockRange(block) }}</p>
                              @if (block.reason) {
                                <p class="text-slate-500">{{ block.reason }}</p>
                              }
                            </div>
                            <button type="button" (click)="removeBlock(block)" class="text-rose-400 hover:text-rose-300">Remover</button>
                          </li>
                        }
                      </ul>
                    }
                  </div>
                }
              }
            </section>
          }

          @if (activeTab() === 'account') {
            <section class="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <h2 class="text-xl font-semibold text-white">Conta</h2>
              @if (profile()) {
                <dl class="mt-4 space-y-2 text-sm">
                  <div class="flex gap-2">
                    <dt class="text-slate-400">Usuario:</dt>
                    <dd class="text-white">{{ profile()!.user.name }} ({{ profile()!.user.email }})</dd>
                  </div>
                  <div class="flex gap-2">
                    <dt class="text-slate-400">Salao:</dt>
                    <dd class="text-white">{{ profile()!.tenant.name }} / {{ profile()!.tenant.slug }}</dd>
                  </div>
                  <div class="flex gap-2">
                    <dt class="text-slate-400">Perfil:</dt>
                    <dd class="text-violet-300">{{ roleLabel(profile()!.role) }}</dd>
                  </div>
                </dl>

                <div class="mt-8">
                  <h3 class="text-sm font-semibold uppercase tracking-wider text-slate-400">Equipe do salao</h3>
                  @if (teamMembersLoading()) {
                    <p class="mt-3 text-sm text-slate-400">Carregando equipe...</p>
                  } @else if (teamMembers().length === 0) {
                    <p class="mt-3 text-sm text-slate-400">Nenhum membro cadastrado.</p>
                  } @else {
                    <div class="mt-3 space-y-2">
                      @for (member of teamMembers(); track member.publicId) {
                        <div class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/40 px-4 py-3">
                          <div>
                            <p class="font-medium text-white">{{ member.name }}</p>
                            <p class="text-xs text-slate-400">{{ member.email }}</p>
                          </div>
                          <div class="flex flex-wrap items-center gap-2 text-xs">
                            <span class="rounded-full bg-slate-800 px-2 py-1 text-slate-300">{{ roleLabel(member.role) }}</span>
                            <span class="rounded-full px-2 py-1" [class.bg-sky-500/15]="member.loginActive" [class.text-sky-300]="member.loginActive" [class.bg-rose-500/15]="!member.loginActive" [class.text-rose-300]="!member.loginActive">
                              {{ member.loginActive ? 'Com acesso' : 'Sem acesso' }}
                            </span>
                          </div>
                        </div>
                      }
                    </div>
                  }
                </div>

                <button
                  type="button"
                  (click)="logout()"
                  class="mt-6 rounded-lg border border-rose-500/30 px-4 py-2 text-sm font-medium text-rose-400 transition hover:bg-rose-500/10 md:hidden"
                >
                  Sair da conta
                </button>
              } @else if (profileError()) {
                <p class="mt-4 text-rose-400">{{ profileError() }}</p>
                <a routerLink="/login" class="mt-4 inline-block text-sm text-violet-400 hover:text-violet-300">Ir para login</a>
              } @else {
                <p class="mt-4 text-slate-400">Carregando perfil...</p>
              }
            </section>
          }
        </div>
      </div>
    </div>
  `,
})
export class SettingsComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly settingsService = inject(SettingsService);
  private readonly teamService = inject(TeamService);
  private readonly scheduleService = inject(ScheduleService);

  protected readonly profile = signal<MeResponse | null>(null);
  protected readonly profileError = signal<string | null>(null);
  protected readonly activeTab = signal<SettingsTab>('account');
  protected readonly banner = signal<{ type: 'success' | 'error'; message: string } | null>(null);

  protected readonly salonSettings = signal<SalonSettings | null>(null);
  protected readonly schedulingSettings = signal<SchedulingSettings | null>(null);
  protected readonly salonLoading = signal(false);
  protected readonly salonSaving = signal(false);
  protected readonly socialSaving = signal(false);
  protected readonly schedulingSaving = signal(false);
  protected readonly logoPreview = signal<string | null>(null);
  protected readonly logoUploadError = signal<string | null>(null);

  protected readonly professionals = signal<Professional[]>([]);
  protected readonly professionalsLoading = signal(false);
  protected readonly showMemberForm = signal(false);
  protected readonly memberSaving = signal(false);
  protected readonly editingMemberId = signal<string | null>(null);
  protected readonly editMemberSaving = signal(false);

  protected readonly teamMembers = signal<TeamMember[]>([]);
  protected readonly teamMembersLoading = signal(false);

  protected readonly selectedProfessionalId = signal<string | null>(null);
  protected readonly dayRows = signal<DayScheduleRow[]>(this.defaultDayRows());
  protected readonly blockedPeriods = signal<BlockedPeriod[]>([]);
  protected readonly scheduleLoading = signal(false);
  protected readonly scheduleSaving = signal(false);
  protected readonly blockSaving = signal(false);

  protected readonly personalizationForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    description: [''],
    phone: ['', (control: AbstractControl) => optionalPhoneValidator(control.value)],
    whatsapp: ['', (control: AbstractControl) => optionalPhoneValidator(control.value)],
    address: [''],
    logoUrl: [''],
  });

  protected readonly socialForm = this.fb.nonNullable.group({
    instagramUrl: [''],
    facebookUrl: [''],
    tiktokUrl: [''],
    websiteUrl: [''],
    youtubeUrl: [''],
    googleMapsUrl: [''],
  });

  protected readonly schedulingForm = this.fb.nonNullable.group({
    zoneId: ['America/Sao_Paulo', Validators.required],
    bufferMinutes: [15, [Validators.required, Validators.min(0)]],
    slotIntervalMinutes: [15, [Validators.required, Validators.min(5)]],
    dayStartTime: ['09:00', Validators.required],
    dayEndTime: ['22:00', Validators.required],
  });

  protected readonly memberForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    phone: ['', (control: AbstractControl) => optionalPhoneValidator(control.value)],
    bookable: [true],
  });

  protected readonly editMemberForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    phone: ['', (control: AbstractControl) => optionalPhoneValidator(control.value)],
    role: ['PROFESSIONAL' as TeamRole, Validators.required],
    bookable: [true],
    active: [true],
    loginActive: [true],
    password: ['', (control: AbstractControl) => {
      const value = String(control.value ?? '');
      if (!value) {
        return null;
      }
      return value.length >= 8 ? null : { minlength: true };
    }],
  });

  protected readonly roleOptions: { value: TeamRole; label: string }[] = [
    { value: 'ADMIN', label: 'Administrador' },
    { value: 'PROFESSIONAL', label: 'Profissional' },
  ];

  protected readonly blockForm = this.fb.nonNullable.group({
    startAt: ['', Validators.required],
    endAt: ['', Validators.required],
    blockType: ['VACATION' as BlockType, Validators.required],
    reason: [''],
  });

  protected readonly isAdmin = computed(() => this.profile()?.role === 'ADMIN');

  protected readonly visibleTabs = computed(() => {
    const tabs: { id: SettingsTab; label: string }[] = [];
    if (this.isAdmin()) {
      tabs.push(
        { id: 'personalization', label: 'Personalizacao' },
        { id: 'social', label: 'Redes' },
        { id: 'funcionamento', label: 'Funcionamento' },
        { id: 'professionals', label: 'Profissionais' },
        { id: 'agenda', label: 'Agenda' }
      );
    }
    tabs.push({ id: 'account', label: 'Conta' });
    return tabs;
  });

  constructor() {
    if (!this.auth.isAuthenticated()) {
      this.profileError.set('Voce nao esta autenticado.');
      return;
    }

    this.auth.getMe().subscribe({
      next: (response) => {
        this.profile.set(response);
        this.activeTab.set(response.role === 'ADMIN' ? 'personalization' : 'account');
        this.loadTeamMembers();
        if (response.role === 'ADMIN') {
          this.loadAdminData();
        }
      },
      error: () => this.profileError.set('Nao foi possivel carregar o perfil.'),
    });
  }

  protected formatPhoneDisplay = formatPhoneDisplay;
  protected roleLabel = roleLabel;

  protected setTab(tab: SettingsTab): void {
    this.activeTab.set(tab);
    this.banner.set(null);
  }

  protected savePersonalization(): void {
    if (this.personalizationForm.invalid || this.salonSaving()) return;
    this.salonSaving.set(true);
    this.settingsService.updateSalonSettings(this.buildSalonPayload()).subscribe({
      next: (settings) => {
        this.salonSettings.set(settings);
        this.logoPreview.set(settings.logoUrl ?? null);
        this.salonSaving.set(false);
        this.showBanner('success', 'Personalizacao atualizada.');
      },
      error: () => {
        this.salonSaving.set(false);
        this.showBanner('error', 'Nao foi possivel salvar a personalizacao.');
      },
    });
  }

  protected saveSocial(): void {
    if (this.socialSaving()) return;
    this.socialSaving.set(true);
    this.settingsService.updateSalonSettings(this.buildSalonPayload()).subscribe({
      next: (settings) => {
        this.salonSettings.set(settings);
        this.socialSaving.set(false);
        this.showBanner('success', 'Redes atualizadas.');
      },
      error: () => {
        this.socialSaving.set(false);
        this.showBanner('error', 'Nao foi possivel salvar as redes.');
      },
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
      this.personalizationForm.controls.logoUrl.setValue(dataUrl);
      this.logoPreview.set(dataUrl);
    } catch (error) {
      this.logoUploadError.set(
        error instanceof Error ? error.message : 'Nao foi possivel carregar a imagem.'
      );
    }
  }

  protected saveScheduling(): void {
    if (this.schedulingForm.invalid || this.schedulingSaving()) return;
    this.schedulingSaving.set(true);
    this.settingsService.updateSchedulingSettings(this.schedulingForm.getRawValue()).subscribe({
      next: (settings) => {
        this.schedulingSettings.set(settings);
        this.schedulingSaving.set(false);
        this.showBanner('success', 'Regras de agenda atualizadas.');
      },
      error: () => {
        this.schedulingSaving.set(false);
        this.showBanner('error', 'Nao foi possivel salvar as regras.');
      },
    });
  }

  protected toggleMemberForm(): void {
    this.showMemberForm.update((value) => !value);
  }

  protected createMember(): void {
    if (this.memberForm.invalid || this.memberSaving()) return;
    this.memberSaving.set(true);
    const raw = this.memberForm.getRawValue();
    const payload: CreateTeamMember = {
      ...raw,
      email: raw.email.trim().toLowerCase(),
      phone: normalizePhoneValue(raw.phone),
    };
    this.teamService.createProfessional(payload).subscribe({
      next: () => {
        this.memberSaving.set(false);
        this.showMemberForm.set(false);
        this.memberForm.reset({ bookable: true });
        this.loadProfessionals();
        this.loadTeamMembers();
        this.showBanner('success', 'Profissional criado.');
      },
      error: (err) => {
        this.memberSaving.set(false);
        const message =
          err?.error?.message ??
          (err?.error?.code === 'EMAIL_ALREADY_EXISTS'
            ? 'Este email ja esta cadastrado.'
            : 'Nao foi possivel criar o profissional.');
        this.showBanner('error', message);
      },
    });
  }

  protected startEditMember(pro: Professional): void {
    this.editingMemberId.set(pro.publicId);
    this.showMemberForm.set(false);
    this.editMemberForm.reset({
      name: pro.name,
      phone: formatPhoneDisplay(pro.phone),
      role: pro.role,
      bookable: pro.bookable,
      active: pro.active,
      loginActive: pro.loginActive,
      password: '',
    });
  }

  protected cancelEditMember(): void {
    this.editingMemberId.set(null);
    this.editMemberForm.reset();
  }

  protected saveEditMember(): void {
    const memberId = this.editingMemberId();
    if (!memberId || this.editMemberForm.invalid || this.editMemberSaving()) {
      return;
    }

    this.editMemberSaving.set(true);
    const raw = this.editMemberForm.getRawValue();
    const payload = {
      name: raw.name.trim(),
      phone: normalizePhoneValue(raw.phone),
      role: raw.role,
      bookable: raw.bookable,
      active: raw.active,
      loginActive: raw.loginActive,
      ...(raw.password ? { password: raw.password } : {}),
    };

    this.teamService.updateTeamMember(memberId, payload).subscribe({
      next: (updated) => {
        this.professionals.update((items) =>
          items.map((item) => (item.publicId === updated.publicId ? updated : item))
        );
        this.editingMemberId.set(null);
        this.editMemberSaving.set(false);
        this.loadTeamMembers();
        this.showBanner('success', 'Profissional atualizado.');
      },
      error: () => {
        this.editMemberSaving.set(false);
        this.showBanner('error', 'Nao foi possivel atualizar o profissional.');
      },
    });
  }

  protected onProfessionalChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedProfessionalId.set(value || null);
    if (value) {
      this.loadSchedule(value);
    }
  }

  protected toggleDay(dayOfWeek: number, event: Event): void {
    const enabled = (event.target as HTMLInputElement).checked;
    this.dayRows.update((rows) =>
      rows.map((row) => (row.dayOfWeek === dayOfWeek ? { ...row, enabled } : row))
    );
  }

  protected toggleLunch(dayOfWeek: number, event: Event): void {
    const enabled = (event.target as HTMLInputElement).checked;
    this.dayRows.update((rows) =>
      rows.map((row) => (row.dayOfWeek === dayOfWeek ? { ...row, lunchEnabled: enabled } : row))
    );
  }

  protected updateDayTime(
    dayOfWeek: number,
    field: 'startTime' | 'endTime' | 'lunchStart' | 'lunchEnd',
    event: Event
  ): void {
    const value = (event.target as HTMLInputElement).value;
    this.dayRows.update((rows) =>
      rows.map((row) => (row.dayOfWeek === dayOfWeek ? { ...row, [field]: value } : row))
    );
  }

  protected saveWorkingHours(): void {
    const memberId = this.selectedProfessionalId();
    if (!memberId || this.scheduleSaving()) return;

    const periods: WorkingPeriodEntry[] = [];
    for (const row of this.dayRows()) {
      if (!row.enabled) {
        continue;
      }
      if (row.lunchEnabled && row.lunchStart && row.lunchEnd && row.lunchStart < row.lunchEnd) {
        periods.push({
          dayOfWeek: row.dayOfWeek,
          startTime: row.startTime,
          endTime: row.lunchStart,
        });
        periods.push({
          dayOfWeek: row.dayOfWeek,
          startTime: row.lunchEnd,
          endTime: row.endTime,
        });
      } else {
        periods.push({
          dayOfWeek: row.dayOfWeek,
          startTime: row.startTime,
          endTime: row.endTime,
        });
      }
    }

    this.scheduleSaving.set(true);
    this.scheduleService.updateWorkingHours(memberId, periods).subscribe({
      next: () => {
        this.scheduleSaving.set(false);
        this.showBanner('success', 'Horarios salvos.');
      },
      error: () => {
        this.scheduleSaving.set(false);
        this.showBanner('error', 'Nao foi possivel salvar os horarios.');
      },
    });
  }

  protected createBlock(): void {
    const memberId = this.selectedProfessionalId();
    if (!memberId || this.blockForm.invalid || this.blockSaving()) return;

    const raw = this.blockForm.getRawValue();
    this.blockSaving.set(true);
    this.scheduleService
      .createBlockedPeriod(memberId, {
        startAt: this.toOffsetDateTime(raw.startAt),
        endAt: this.toOffsetDateTime(raw.endAt),
        reason: raw.reason || undefined,
        blockType: raw.blockType,
      })
      .subscribe({
        next: () => {
          this.blockSaving.set(false);
          this.blockForm.reset({ blockType: 'VACATION' });
          this.loadSchedule(memberId);
          this.showBanner('success', 'Bloqueio adicionado.');
        },
        error: () => {
          this.blockSaving.set(false);
          this.showBanner('error', 'Nao foi possivel adicionar o bloqueio.');
        },
      });
  }

  protected removeBlock(block: BlockedPeriod): void {
    const memberId = this.selectedProfessionalId();
    if (!memberId) return;
    this.scheduleService.deleteBlockedPeriod(memberId, block.publicId).subscribe({
      next: () => {
        this.loadSchedule(memberId);
        this.showBanner('success', 'Bloqueio removido.');
      },
      error: () => this.showBanner('error', 'Nao foi possivel remover o bloqueio.'),
    });
  }

  protected blockTypeLabel(type: BlockType): string {
    switch (type) {
      case 'VACATION':
        return 'Ferias';
      case 'BREAK':
        return 'Pausa';
      default:
        return 'Bloqueio';
    }
  }

  protected formatBlockRange(block: BlockedPeriod): string {
    return `${this.formatDateTime(block.startAt)} — ${this.formatDateTime(block.endAt)}`;
  }

  protected logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/login');
  }

  private loadAdminData(): void {
    this.salonLoading.set(true);
    forkJoin({
      salon: this.settingsService.getSalonSettings(),
      scheduling: this.settingsService.getSchedulingSettings(),
    }).subscribe({
      next: ({ salon, scheduling }) => {
        this.salonSettings.set(salon);
        this.schedulingSettings.set(scheduling);
        this.personalizationForm.patchValue({
          name: salon.name,
          description: salon.description ?? '',
          phone: formatPhoneDisplay(salon.phone),
          whatsapp: formatPhoneDisplay(salon.whatsapp),
          address: salon.address ?? '',
          logoUrl: salon.logoUrl ?? '',
        });
        this.socialForm.patchValue({
          instagramUrl: salon.instagramUrl ?? '',
          facebookUrl: salon.facebookUrl ?? '',
          tiktokUrl: salon.tiktokUrl ?? '',
          websiteUrl: salon.websiteUrl ?? '',
          youtubeUrl: salon.youtubeUrl ?? '',
          googleMapsUrl: salon.googleMapsUrl ?? '',
        });
        this.logoPreview.set(salon.logoUrl ?? null);
        this.schedulingForm.patchValue({
          zoneId: scheduling.zoneId,
          bufferMinutes: scheduling.bufferMinutes,
          slotIntervalMinutes: scheduling.slotIntervalMinutes,
          dayStartTime: scheduling.dayStartTime.slice(0, 5),
          dayEndTime: scheduling.dayEndTime.slice(0, 5),
        });
        this.salonLoading.set(false);
      },
      error: () => {
        this.salonLoading.set(false);
        this.showBanner('error', 'Nao foi possivel carregar as configuracoes.');
      },
    });
    this.loadProfessionals();
  }

  private loadTeamMembers(): void {
    this.teamMembersLoading.set(true);
    this.teamService.getMembers().subscribe({
      next: (items) => {
        this.teamMembers.set(items);
        this.teamMembersLoading.set(false);
      },
      error: () => {
        this.teamMembersLoading.set(false);
      },
    });
  }

  private loadProfessionals(): void {
    this.professionalsLoading.set(true);
    this.teamService.listAllProfessionalProfiles().subscribe({
      next: (items) => {
        this.professionals.set(items);
        this.professionalsLoading.set(false);
        if (!this.selectedProfessionalId() && items.length > 0) {
          this.selectedProfessionalId.set(items[0].publicId);
          this.loadSchedule(items[0].publicId);
        }
      },
      error: () => {
        this.professionalsLoading.set(false);
        this.showBanner('error', 'Nao foi possivel carregar profissionais.');
      },
    });
  }

  private loadSchedule(memberPublicId: string): void {
    this.scheduleLoading.set(true);
    forkJoin({
      working: this.scheduleService.getWorkingHours(memberPublicId),
      blocks: this.scheduleService.listBlockedPeriods(memberPublicId),
    }).subscribe({
      next: ({ working, blocks }) => {
        this.blockedPeriods.set(blocks);
        this.dayRows.set(this.mergeWorkingHours(working));
        this.scheduleLoading.set(false);
      },
      error: () => {
        this.scheduleLoading.set(false);
        this.showBanner('error', 'Nao foi possivel carregar a agenda.');
      },
    });
  }

  private mergeWorkingHours(periods: { dayOfWeek: number; startTime: string; endTime: string }[]): DayScheduleRow[] {
    return WEEKDAYS.map((day) => {
      const dayPeriods = periods
        .filter((period) => period.dayOfWeek === day.value)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));

      if (dayPeriods.length >= 2) {
        const first = dayPeriods[0];
        const last = dayPeriods[dayPeriods.length - 1];
        return {
          dayOfWeek: day.value,
          label: day.label,
          enabled: true,
          startTime: first.startTime.slice(0, 5),
          endTime: last.endTime.slice(0, 5),
          lunchEnabled: true,
          lunchStart: first.endTime.slice(0, 5),
          lunchEnd: last.startTime.slice(0, 5),
        };
      }

      const match = dayPeriods[0];
      return {
        dayOfWeek: day.value,
        label: day.label,
        enabled: !!match,
        startTime: match?.startTime?.slice(0, 5) ?? '09:00',
        endTime: match?.endTime?.slice(0, 5) ?? '18:00',
        lunchEnabled: false,
        lunchStart: '12:00',
        lunchEnd: '13:00',
      };
    });
  }

  private defaultDayRows(): DayScheduleRow[] {
    return WEEKDAYS.map((day) => ({
      dayOfWeek: day.value,
      label: day.label,
      enabled: day.value <= 5,
      startTime: '09:00',
      endTime: '18:00',
      lunchEnabled: false,
      lunchStart: '12:00',
      lunchEnd: '13:00',
    }));
  }

  private buildSalonPayload() {
    const personalization = this.personalizationForm.getRawValue();
    const social = this.socialForm.getRawValue();
    return {
      name: personalization.name,
      description: personalization.description || undefined,
      phone: normalizePhoneValue(personalization.phone),
      whatsapp: normalizePhoneValue(personalization.whatsapp),
      address: personalization.address || undefined,
      logoUrl: personalization.logoUrl || undefined,
      instagramUrl: social.instagramUrl || undefined,
      facebookUrl: social.facebookUrl || undefined,
      tiktokUrl: social.tiktokUrl || undefined,
      websiteUrl: social.websiteUrl || undefined,
      youtubeUrl: social.youtubeUrl || undefined,
      googleMapsUrl: social.googleMapsUrl || undefined,
    };
  }

  private showBanner(type: 'success' | 'error', message: string): void {
    this.banner.set({ type, message });
  }

  private toOffsetDateTime(localValue: string): string {
    return new Date(localValue).toISOString();
  }

  private formatDateTime(value: string): string {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(value));
  }
}
