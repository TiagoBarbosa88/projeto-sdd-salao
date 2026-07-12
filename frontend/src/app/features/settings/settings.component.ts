import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
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
          <button
            type="button"
            (click)="logout()"
            class="mt-6 rounded-lg border border-rose-500/30 px-4 py-2 text-sm font-medium text-rose-400 transition hover:bg-rose-500/10 md:hidden"
          >
            Sair da conta
          </button>
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
  private readonly router = inject(Router);

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

  protected logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/login');
  }
}
