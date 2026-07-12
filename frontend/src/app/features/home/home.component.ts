import { Component, inject, signal } from '@angular/core';
import { HealthService } from '../../core/services/health.service';

@Component({
  selector: 'app-home',
  standalone: true,
  template: `
    <section class="rounded-xl border border-slate-800 bg-slate-900 p-6">
      <h2 class="text-xl font-semibold text-white">Status da API</h2>
      @if (loading()) {
        <p class="mt-4 text-slate-400">Verificando...</p>
      } @else if (error()) {
        <p class="mt-4 text-rose-400">{{ error() }}</p>
      } @else {
        <p class="mt-4 text-emerald-400">{{ status() }} — {{ service() }}</p>
      }
    </section>
  `,
})
export class HomeComponent {
  private readonly health = inject(HealthService);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly status = signal('');
  protected readonly service = signal('');

  constructor() {
    this.health.check().subscribe({
      next: (res) => {
        this.status.set(res.status);
        this.service.set(res.service);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('API indisponivel. Inicie o backend e o PostgreSQL.');
        this.loading.set(false);
      },
    });
  }
}
