import { Component, inject, OnInit, signal } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  PublicSalonService,
  PublicService,
  PublicTenant,
} from '../../core/services/public-salon.service';

@Component({
  selector: 'app-public-salon',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen bg-slate-950 text-slate-100">
      <header class="border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-xl">
        <div class="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <div>
            @if (tenant()) {
              <p class="text-xs uppercase tracking-wider text-violet-400">Agende online</p>
              <h1 class="text-2xl font-bold text-white">{{ tenant()!.name }}</h1>
            } @else if (!loading()) {
              <h1 class="text-2xl font-bold text-white">Salao nao encontrado</h1>
            }
          </div>
          <a
            routerLink="/login"
            class="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-500"
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
            <a routerLink="/login" class="mt-4 inline-block text-sm text-violet-400 hover:text-violet-300">
              Ir para login
            </a>
          </section>
        } @else if (tenant()) {
          <section class="mb-8 rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-violet-950/30 to-slate-900 p-8">
            <h2 class="text-xl font-semibold text-white">Bem-vindo ao {{ tenant()!.name }}</h2>
            <p class="mt-2 max-w-2xl text-slate-300">
              Conheca nossos servicos e agende seu horario. Atendimento profissional com praticidade.
            </p>
          </section>

          <section>
            <h2 class="text-lg font-semibold text-white">Servicos disponiveis</h2>
            @if (services().length === 0) {
              <p class="mt-4 text-slate-400">Nenhum servico disponivel no momento.</p>
            } @else {
              <div class="mt-4 grid gap-4 sm:grid-cols-2">
                @for (service of services(); track service.publicId) {
                  <article class="rounded-xl border border-slate-800 bg-slate-900 p-5">
                    <h3 class="font-semibold text-white">{{ service.name }}</h3>
                    @if (service.description) {
                      <p class="mt-2 text-sm text-slate-400">{{ service.description }}</p>
                    }
                    <div class="mt-4 flex items-center justify-between text-sm">
                      <span class="text-slate-400">{{ service.durationMinutes }} min</span>
                      <span class="font-semibold text-emerald-400">{{ formatCurrency(service.price) }}</span>
                    </div>
                  </article>
                }
              </div>
            }
          </section>
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

  protected readonly tenant = signal<PublicTenant | null>(null);
  protected readonly services = signal<PublicService[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (!slug) {
      this.error.set('Salao invalido.');
      this.loading.set(false);
      return;
    }

    forkJoin({
      tenant: this.publicSalon.getTenant(slug),
      services: this.publicSalon.listServices(slug),
    }).subscribe({
      next: ({ tenant, services }) => {
        this.tenant.set(tenant);
        this.services.set(services);
        this.applySeo(tenant, services);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Salao nao encontrado ou indisponivel.');
        this.loading.set(false);
      },
    });
  }

  protected formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  private applySeo(tenant: PublicTenant, services: PublicService[]): void {
    const serviceNames = services.map((s) => s.name).join(', ');
    const description = serviceNames
      ? `Agende online no ${tenant.name}. Servicos: ${serviceNames}.`
      : `Agende online no ${tenant.name}.`;

    this.title.setTitle(`${tenant.name} | Agende online`);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: `${tenant.name} | Agende online` });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
  }
}
