import { Component, inject, OnInit, signal } from '@angular/core';
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { filter, map } from 'rxjs';
import { AuthService } from '../core/services/auth.service';

interface NavItem {
  label: string;
  route: string;
  exact?: boolean;
  icon: 'home' | 'services' | 'financeiro' | 'audit' | 'settings';
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen bg-slate-950">
      <aside
        class="group fixed inset-y-0 left-0 z-30 flex w-[4.5rem] flex-col overflow-hidden border-r border-slate-800/60 bg-slate-950/80 backdrop-blur-xl transition-[width] duration-300 ease-in-out hover:w-64"
      >
        <!-- Nav -->
        <nav class="flex flex-1 flex-col gap-1 overflow-y-auto px-0 pb-3 pt-4 group-hover:px-2">
          @for (item of navItems(); track item.route) {
            <a
              [routerLink]="item.route"
              routerLinkActive="bg-violet-600/20 text-violet-200 ring-1 ring-violet-500/30"
              [routerLinkActiveOptions]="{ exact: item.exact ?? false }"
              class="mx-auto flex h-10 w-10 items-center justify-center gap-0 rounded-xl text-slate-400 transition hover:bg-slate-800/60 hover:text-white group-hover:mx-0 group-hover:h-auto group-hover:w-full group-hover:justify-start group-hover:gap-3 group-hover:px-3 group-hover:py-2.5"
              [attr.title]="item.label"
            >
              <span class="flex h-5 w-5 shrink-0 items-center justify-center">
                @switch (item.icon) {
                  @case ('home') {
                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                    </svg>
                  }
                  @case ('services') {
                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6Z" />
                    </svg>
                  }
                  @case ('audit') {
                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                    </svg>
                  }
                  @case ('financeiro') {
                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
                    </svg>
                  }
                  @case ('settings') {
                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                  }
                }
              </span>
              <span
                class="max-w-0 w-0 overflow-hidden whitespace-nowrap text-sm font-medium opacity-0 transition-all duration-200 group-hover:max-w-[12rem] group-hover:w-auto group-hover:opacity-100"
              >
                {{ item.label }}
              </span>
            </a>
          }

        </nav>

        <!-- Footer -->
        <div class="shrink-0 border-t border-slate-800/60 px-0 py-3 group-hover:px-2">
          <button
            type="button"
            (click)="logout()"
            class="mx-auto flex h-10 w-10 items-center justify-center gap-0 rounded-xl text-slate-400 transition hover:bg-red-500/10 hover:text-red-300 group-hover:mx-0 group-hover:h-auto group-hover:w-full group-hover:justify-start group-hover:gap-3 group-hover:px-3 group-hover:py-2.5"
            title="Sair"
          >
            <span class="flex h-5 w-5 shrink-0 items-center justify-center">
              <svg
                class="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
                />
              </svg>
            </span>
            <span
              class="max-w-0 w-0 overflow-hidden whitespace-nowrap text-sm font-medium opacity-0 transition-all duration-200 group-hover:max-w-[12rem] group-hover:w-auto group-hover:opacity-100"
            >
              Sair
            </span>
          </button>
        </div>
      </aside>

      <div class="min-h-screen pl-[4.5rem]">
        <!-- Banner -->
        <div
          class="relative overflow-hidden border-b border-slate-800/60 bg-gradient-to-r from-slate-900 via-violet-950/40 to-slate-900 px-8 py-8"
        >
          <div
            class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-violet-600/20 via-transparent to-transparent"
          ></div>
          <div class="relative flex items-center gap-5">
            <div
              class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-violet-700 shadow-lg shadow-violet-900/50 ring-1 ring-violet-400/20"
            >
              <svg
                class="h-7 w-7 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"
                />
              </svg>
            </div>
            <div>
              <h1 class="text-2xl font-bold tracking-tight text-white">
                {{ pageTitle() }}
              </h1>
              @if (tenantName()) {
                <p class="mt-1 text-sm text-slate-400">
                  Bem-vindo ao
                  <span class="font-medium text-violet-300">{{ tenantName() }}</span>
                </p>
              }
            </div>
          </div>
        </div>

        <main class="px-8 py-8">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class ShellComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly pageTitle = signal('Agenda');
  protected readonly tenantName = signal<string | null>(null);
  protected readonly navItems = signal<NavItem[]>([
    { label: 'Agenda', route: '/', exact: true, icon: 'home' },
    { label: 'Servicos', route: '/services', icon: 'services' },
    { label: 'Financeiro', route: '/financeiro', icon: 'financeiro' },
    { label: 'Configuracoes', route: '/settings', icon: 'settings' },
  ]);

  ngOnInit(): void {
    this.auth.getMe().subscribe({
      next: (profile) => {
        this.tenantName.set(profile.tenant.name);

        const items: NavItem[] = [
          { label: 'Agenda', route: '/', exact: true, icon: 'home' },
          { label: 'Servicos', route: '/services', icon: 'services' },
          { label: 'Financeiro', route: '/financeiro', icon: 'financeiro' },
        ];

        if (profile.role === 'ADMIN') {
          items.push({ label: 'Auditoria', route: '/audit', icon: 'audit' });
        }

        items.push({ label: 'Configuracoes', route: '/settings', icon: 'settings' });
        this.navItems.set(items);
      },
      error: () => {},
    });

    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map(() => this.resolvePageTitle())
      )
      .subscribe((title) => this.pageTitle.set(title));

    this.pageTitle.set(this.resolvePageTitle());
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/login');
  }

  private resolvePageTitle(): string {
    let child = this.route.firstChild;
    while (child?.firstChild) {
      child = child.firstChild;
    }
    return (child?.snapshot.data['title'] as string | undefined) ?? 'Painel';
  }

}
