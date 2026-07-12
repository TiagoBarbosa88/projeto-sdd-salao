import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export type BlockType = 'VACATION' | 'BREAK' | 'OTHER';

export interface WorkingPeriod {
  publicId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface WorkingPeriodEntry {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface BlockedPeriod {
  publicId: string;
  startAt: string;
  endAt: string;
  reason?: string;
  blockType: BlockType;
}

export interface CreateBlockedPeriod {
  startAt: string;
  endAt: string;
  reason?: string;
  blockType: BlockType;
}

@Injectable({ providedIn: 'root' })
export class ScheduleService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1/team/members';

  getWorkingHours(memberPublicId: string): Observable<WorkingPeriod[]> {
    return this.http.get<WorkingPeriod[]>(`${this.baseUrl}/${memberPublicId}/working-hours`);
  }

  updateWorkingHours(
    memberPublicId: string,
    periods: WorkingPeriodEntry[]
  ): Observable<WorkingPeriod[]> {
    return this.http.put<WorkingPeriod[]>(`${this.baseUrl}/${memberPublicId}/working-hours`, {
      periods,
    });
  }

  listBlockedPeriods(memberPublicId: string): Observable<BlockedPeriod[]> {
    return this.http.get<BlockedPeriod[]>(`${this.baseUrl}/${memberPublicId}/blocked-periods`);
  }

  createBlockedPeriod(
    memberPublicId: string,
    payload: CreateBlockedPeriod
  ): Observable<BlockedPeriod> {
    return this.http.post<BlockedPeriod>(
      `${this.baseUrl}/${memberPublicId}/blocked-periods`,
      payload
    );
  }

  deleteBlockedPeriod(memberPublicId: string, blockPublicId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/${memberPublicId}/blocked-periods/${blockPublicId}`
    );
  }
}
