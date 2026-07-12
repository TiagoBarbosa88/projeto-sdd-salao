import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen">
      <header class="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p class="text-xs uppercase tracking-widest text-violet-400">Salao SaaS</p>
            <h1 class="text-lg font-semibold text-white">Painel base</h1>
          </div>
          <nav class="flex items-center gap-1">
            <a
              routerLink="/"
              routerLinkActive="bg-slate-800 text-white"
              [routerLinkActiveOptions]="{ exact: true }"
              class="rounded-lg px-3 py-1.5 text-sm text-slate-300 transition hover:text-white"
            >
              Home
            </a>
            <a
              routerLink="/services"
              routerLinkActive="bg-slate-800 text-white"
              class="rounded-lg px-3 py-1.5 text-sm text-slate-300 transition hover:text-white"
            >
              Servicos
            </a>
            <a
              routerLink="/appointments"
              routerLinkActive="bg-slate-800 text-white"
              class="rounded-lg px-3 py-1.5 text-sm text-slate-300 transition hover:text-white"
            >
              Agenda
            </a>
            <a
              routerLink="/dashboard"
              routerLinkActive="bg-slate-800 text-white"
              class="rounded-lg px-3 py-1.5 text-sm text-slate-300 transition hover:text-white"
            >
              Dashboard
            </a>
            <button
              type="button"
              (click)="logout()"
              class="ml-2 rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
            >
              Sair
            </button>
          </nav>
        </div>
      </header>
      <main class="mx-auto max-w-6xl px-6 py-8">
        <router-outlet />
      </main>
    </div>
  `,
})
export class ShellComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/login');
  }
}
