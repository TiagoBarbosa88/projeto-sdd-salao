import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuditAction, AuditLog, AuditService } from '../../core/services/audit.service';

type AuditDetailRow = {
  label: string;
  value: string;
};

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
                <th class="px-4 py-3 text-right">Detalhes</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800">
              @for (log of logs(); track log.publicId) {
                <tr class="text-slate-200">
                  <td class="px-4 py-3 whitespace-nowrap">{{ formatDateTime(log.createdAt) }}</td>
                  <td class="px-4 py-3">
                    <span
                      class="inline-flex rounded-full bg-violet-500/15 px-2 py-0.5 text-xs font-medium text-violet-300"
                    >
                      {{ actionLabel(log.action) }}
                    </span>
                  </td>
                  <td class="px-4 py-3">{{ log.actor?.name ?? 'Sistema' }}</td>
                  <td class="px-4 py-3 text-right">
                    <button
                      type="button"
                      (click)="openDetail(log)"
                      class="rounded-lg border border-slate-700 px-3 py-1 text-xs font-medium text-violet-300 transition hover:border-violet-500 hover:text-violet-200"
                    >
                      Ver detalhes
                    </button>
                  </td>
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
                <span
                  class="shrink-0 rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-medium text-violet-300"
                >
                  {{ actionLabel(log.action) }}
                </span>
              </div>
              <p class="mt-2 text-sm font-medium text-white">{{ log.actor?.name ?? 'Sistema' }}</p>
              <button
                type="button"
                (click)="openDetail(log)"
                class="mt-2 text-xs font-medium text-violet-400 transition hover:text-violet-300"
              >
                Ver detalhes
              </button>
            </article>
          }
        </div>
      }

      @if (selectedLog()) {
        <div
          class="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 p-4 backdrop-blur-sm sm:items-center"
          (click)="closeDetail()"
          role="presentation"
        >
          <div
            class="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl shadow-black/40"
            role="dialog"
            aria-modal="true"
            aria-labelledby="audit-detail-title"
            (click)="$event.stopPropagation()"
          >
            <div class="flex items-start justify-between gap-4 border-b border-slate-800 px-5 py-4">
              <div>
                <p class="text-xs uppercase tracking-wider text-slate-500">Detalhes do evento</p>
                <h3 id="audit-detail-title" class="mt-1 text-lg font-semibold text-white">
                  {{ actionLabel(selectedLog()!.action) }}
                </h3>
                <p class="mt-1 text-sm text-slate-400">
                  {{ formatDateTime(selectedLog()!.createdAt) }}
                </p>
              </div>
              <button
                type="button"
                (click)="closeDetail()"
                class="rounded-lg border border-slate-700 px-2 py-1 text-sm text-slate-400 transition hover:text-white"
                aria-label="Fechar"
              >
                &times;
              </button>
            </div>

            <dl class="space-y-3 px-5 py-4">
              <div class="flex gap-3 text-sm">
                <dt class="w-28 shrink-0 text-slate-500">Ator</dt>
                <dd class="text-slate-200">{{ selectedLog()!.actor?.name ?? 'Sistema' }}</dd>
              </div>
              @for (row of detailRows(selectedLog()!); track row.label) {
                <div class="flex gap-3 text-sm">
                  <dt class="w-28 shrink-0 text-slate-500">{{ row.label }}</dt>
                  <dd class="min-w-0 break-words text-slate-200">{{ row.value }}</dd>
                </div>
              }
              @if (detailRows(selectedLog()!).length === 0) {
                <p class="text-sm text-slate-400">Nenhum detalhe adicional registrado para este evento.</p>
              }
            </dl>

            <div class="border-t border-slate-800 px-5 py-4">
              <button
                type="button"
                (click)="closeDetail()"
                class="w-full rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-500 hover:text-white"
              >
                Fechar
              </button>
            </div>
          </div>
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
  protected readonly selectedLog = signal<AuditLog | null>(null);

  protected readonly actionOptions: { value: AuditAction; label: string }[] = [
    { value: 'LOGIN', label: 'Login' },
    { value: 'SERVICE_CREATED', label: 'Servico criado' },
    { value: 'SERVICE_UPDATED', label: 'Servico atualizado' },
    { value: 'SERVICE_DEACTIVATED', label: 'Servico desativado' },
    { value: 'APPOINTMENT_CREATED', label: 'Agendamento criado' },
    { value: 'APPOINTMENT_CANCELLED', label: 'Agendamento cancelado' },
  ];

  private readonly detailFieldLabels: Record<string, string> = {
    email: 'E-mail',
    name: 'Nome',
    service: 'Servico',
    startAt: 'Inicio',
    endAt: 'Fim',
    professional: 'Profissional',
    client: 'Cliente',
    status: 'Status',
    price: 'Preco',
    durationMinutes: 'Duracao (min)',
    active: 'Ativo',
  };

  constructor() {
    this.loadLogs();
  }

  protected onActionFilterChange(value: string): void {
    this.selectedAction.set(value as AuditAction | '');
    this.loadLogs();
  }

  protected openDetail(log: AuditLog): void {
    this.selectedLog.set(log);
  }

  protected closeDetail(): void {
    this.selectedLog.set(null);
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

  protected detailRows(log: AuditLog): AuditDetailRow[] {
    const rows: AuditDetailRow[] = [];
    const parsed = this.parseMetadata(log.metadata);

    for (const [key, value] of Object.entries(parsed)) {
      rows.push({
        label: this.detailFieldLabels[key] ?? key,
        value: this.formatDetailValue(key, value),
      });
    }

    if (rows.length === 0 && log.metadata) {
      rows.push({ label: 'Informacao', value: log.metadata });
    }

    return rows;
  }

  private parseMetadata(metadata: string | null): Record<string, unknown> {
    if (!metadata) {
      return {};
    }

    try {
      const parsed = JSON.parse(metadata) as Record<string, unknown>;
      return typeof parsed === 'object' && parsed !== null ? parsed : { informacao: metadata };
    } catch {
      return { informacao: metadata };
    }
  }

  private formatDetailValue(key: string, value: unknown): string {
    if (value === null || value === undefined) {
      return '—';
    }

    if (typeof value === 'boolean') {
      return value ? 'Sim' : 'Nao';
    }

    if (key === 'price' && typeof value === 'number') {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    }

    if ((key === 'startAt' || key === 'endAt') && typeof value === 'string') {
      return this.formatDateTime(value);
    }

    if (key === 'status' && typeof value === 'string') {
      const labels: Record<string, string> = {
        SCHEDULED: 'Agendado',
        CONFIRMED: 'Confirmado',
        CANCELLED: 'Cancelado',
        COMPLETED: 'Concluido',
      };
      return labels[value] ?? value;
    }

    return String(value);
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
