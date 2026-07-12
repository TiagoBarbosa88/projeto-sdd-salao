import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { NamedRef } from './appointment.service';

export type AuditAction =
  | 'LOGIN'
  | 'SERVICE_CREATED'
  | 'SERVICE_UPDATED'
  | 'SERVICE_DEACTIVATED'
  | 'APPOINTMENT_CREATED'
  | 'APPOINTMENT_CANCELLED';

export interface AuditLog {
  publicId: string;
  action: AuditAction;
  actor: NamedRef | null;
  entityType: string | null;
  entityPublicId: string | null;
  metadata: string | null;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class AuditService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1/audit-logs';

  list(action?: AuditAction, date?: string): Observable<AuditLog[]> {
    let params = new HttpParams();
    if (action) {
      params = params.set('action', action);
    }
    if (date) {
      params = params.set('date', date);
    }
    return this.http.get<AuditLog[]>(this.baseUrl, { params });
  }
}
