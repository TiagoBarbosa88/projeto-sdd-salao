import { Component, inject, signal } from '@angular/core';
import { DashboardService, DashboardSummary } from '../../core/services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  template: `
    <div class="space-y-6">
      <div>
        <h2 class="text-xl font-semibold text-white">Financeiro</h2>
        <p class="mt-1 text-sm text-slate-400">Metricas financeiras e operacionais do dia.</p>
      </div>

      @if (loading()) {
        <p class="text-slate-400">Carregando metricas...</p>
      } @else if (error()) {
        <section class="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <p class="text-rose-400">{{ error() }}</p>
        </section>
      } @else if (summary()) {
        <div class="grid gap-4 sm:grid-cols-3">
          <article class="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <p class="text-xs uppercase tracking-wider text-slate-400">Agendamentos hoje</p>
            <p class="mt-2 text-3xl font-semibold text-white">{{ summary()!.appointmentsToday }}</p>
          </article>

          <article class="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <p class="text-xs uppercase tracking-wider text-slate-400">Receita estimada</p>
            <p class="mt-2 text-3xl font-semibold text-emerald-400">
              {{ formatCurrency(summary()!.estimatedRevenue) }}
            </p>
          </article>

          <article class="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <p class="text-xs uppercase tracking-wider text-slate-400">Taxa de ocupacao</p>
            <p class="mt-2 text-3xl font-semibold text-violet-400">
              {{ formatPercent(summary()!.occupancyRate) }}
            </p>
          </article>
        </div>
      }
    </div>
  `,
})
export class DashboardComponent {
  private readonly dashboard = inject(DashboardService);

  protected readonly summary = signal<DashboardSummary | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  constructor() {
    this.dashboard.getSummary().subscribe({
      next: (data) => {
        this.summary.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Nao foi possivel carregar o financeiro.');
        this.loading.set(false);
      },
    });
  }

  protected formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  protected formatPercent(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value);
  }
}
