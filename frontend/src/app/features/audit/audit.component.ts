import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuditAction, AuditLog, AuditService } from '../../core/services/audit.service';

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="space-y-6">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 class="text-xl font-semibold text-white">Auditoria</h2>
          <p class="mt-1 text-sm text-slate-400">Historico de acoes criticas do salao.</p>
        </div>

        <div>
          <label for="actionFilter" class="mb-1 block text-sm text-slate-300">Filtrar por acao</label>
          <select
            id="actionFilter"
            [ngModel]="selectedAction()"
            (ngModelChange)="onActionFilterChange($event)"
            class="rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none focus:border-violet-500"
          >
            <option value="">Todas</option>
            @for (action of actionOptions; track action.value) {
              <option [value]="action.value">{{ action.label }}</option>
            }
          </select>
        </div>
      </div>

      @if (loading()) {
        <p class="text-slate-400">Carregando eventos...</p>
      } @else if (error()) {
        <section class="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <p class="text-rose-400">{{ error() }}</p>
        </section>
      } @else if (logs().length === 0) {
        <section class="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <p class="text-slate-400">Nenhum evento encontrado.</p>
        </section>
      } @else {
        <div class="hidden overflow-hidden rounded-xl border border-slate-800 bg-slate-900 md:block">
          <table class="w-full text-left text-sm">
            <thead
              class="border-b border-slate-800 bg-slate-950/50 text-xs uppercase tracking-wider text-slate-400"
            >
              <tr>
                <th class="px-4 py-3">Data</th>
                <th class="px-4 py-3">Acao</th>
                <th class="px-4 py-3">Ator</th>
                <th class="px-4 py-3">Entidade</th>
                <th class="px-4 py-3">Detalhe</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800">
              @for (log of logs(); track log.publicId) {
                <tr class="text-slate-200">
                  <td class="px-4 py-3 whitespace-nowrap">{{ formatDateTime(log.createdAt) }}</td>
                  <td class="px-4 py-3">
                    <span class="inline-flex rounded-full bg-violet-500/15 px-2 py-0.5 text-xs font-medium text-violet-300">
                      {{ actionLabel(log.action) }}
                    </span>
                  </td>
                  <td class="px-4 py-3">{{ log.actor?.name ?? 'Sistema' }}</td>
                  <td class="px-4 py-3">{{ log.entityType ?? '—' }}</td>
                  <td class="px-4 py-3 text-slate-400">{{ log.metadata ?? '—' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div class="space-y-2 md:hidden">
          @for (log of logs(); track log.publicId) {
            <article class="rounded-xl border border-slate-800 bg-slate-900 p-3">
              <div class="flex items-start justify-between gap-2">
                <p class="text-xs text-slate-400">{{ formatDateTime(log.createdAt) }}</p>
                <span class="shrink-0 rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-medium text-violet-300">
                  {{ actionLabel(log.action) }}
                </span>
              </div>
              <p class="mt-2 text-sm font-medium text-white">{{ log.actor?.name ?? 'Sistema' }}</p>
              <div class="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
                @if (log.entityType) {
                  <span>{{ log.entityType }}</span>
                }
                @if (log.metadata) {
                  <span class="text-slate-400">{{ log.metadata }}</span>
                }
              </div>
            </article>
          }
        </div>
      }
    </div>
  `,
})
export class AuditComponent {
  private readonly auditApi = inject(AuditService);

  protected readonly logs = signal<AuditLog[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly selectedAction = signal<AuditAction | ''>('');

  protected readonly actionOptions: { value: AuditAction; label: string }[] = [
    { value: 'LOGIN', label: 'Login' },
    { value: 'SERVICE_CREATED', label: 'Servico criado' },
    { value: 'SERVICE_UPDATED', label: 'Servico atualizado' },
    { value: 'SERVICE_DEACTIVATED', label: 'Servico desativado' },
    { value: 'APPOINTMENT_CREATED', label: 'Agendamento criado' },
    { value: 'APPOINTMENT_CANCELLED', label: 'Agendamento cancelado' },
  ];

  constructor() {
    this.loadLogs();
  }

  protected onActionFilterChange(value: string): void {
    this.selectedAction.set(value as AuditAction | '');
    this.loadLogs();
  }

  protected formatDateTime(value: string): string {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'medium',
    }).format(new Date(value));
  }

  protected actionLabel(action: AuditAction): string {
    return this.actionOptions.find((item) => item.value === action)?.label ?? action;
  }

  private loadLogs(): void {
    this.loading.set(true);
    this.error.set(null);

    const action = this.selectedAction() || undefined;
    this.auditApi.list(action).subscribe({
      next: (items) => {
        this.logs.set(items);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Nao foi possivel carregar os eventos de auditoria.');
        this.loading.set(false);
      },
    });
  }
}
