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
  templateUrl: './audit.component.html',
})
export class AuditComponent {
  private readonly auditApi = inject(AuditService);

  protected readonly logs = signal<AuditLog[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly selectedAction = signal<AuditAction | ''>('');
  protected readonly selectedDate = signal('');
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

  protected onDateFilterChange(value: string): void {
    this.selectedDate.set(value);
    this.loadLogs();
  }

  protected clearDateFilter(): void {
    this.selectedDate.set('');
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
    const date = this.selectedDate() || undefined;
    this.auditApi.list(action, date).subscribe({
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
