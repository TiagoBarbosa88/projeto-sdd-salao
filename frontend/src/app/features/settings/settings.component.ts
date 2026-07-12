import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService, MeResponse } from '../../core/services/auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="space-y-6">
      @if (profile()) {
        <section class="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 class="text-xl font-semibold text-white">Sessao ativa</h2>
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
              <dd class="text-violet-300">{{ profile()!.role }}</dd>
            </div>
          </dl>
        </section>
      } @else if (profileError()) {
        <section class="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <p class="text-rose-400">{{ profileError() }}</p>
          <a routerLink="/login" class="mt-4 inline-block text-sm text-violet-400 hover:text-violet-300">
            Ir para login
          </a>
        </section>
      } @else {
        <section class="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <p class="text-slate-400">Carregando perfil...</p>
        </section>
      }
    </div>
  `,
})
export class SettingsComponent {
  private readonly auth = inject(AuthService);

  protected readonly profile = signal<MeResponse | null>(null);
  protected readonly profileError = signal<string | null>(null);

  constructor() {
    if (this.auth.isAuthenticated()) {
      this.auth.getMe().subscribe({
        next: (response) => this.profile.set(response),
        error: () => this.profileError.set('Nao foi possivel carregar o perfil.'),
      });
    } else {
      this.profileError.set('Voce nao esta autenticado.');
    }
  }
}
