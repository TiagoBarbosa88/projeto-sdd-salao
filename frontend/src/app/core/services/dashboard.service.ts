import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface DashboardSummary {
  appointmentsToday: number;
  estimatedRevenue: number;
  occupancyRate: number;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);

  getSummary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>('/api/v1/dashboard/summary');
  }
}
