import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export type AppointmentStatus = 'SCHEDULED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export interface NamedRef {
  publicId: string;
  name: string;
}

export interface Appointment {
  publicId: string;
  service: NamedRef;
  professional: NamedRef;
  client: NamedRef;
  startAt: string;
  endAt: string;
  status: AppointmentStatus;
  createdAt: string;
}

export interface CreateAppointmentRequest {
  servicePublicId: string;
  professionalPublicId: string;
  clientPublicId?: string;
  startAt: string;
}

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1/appointments';

  list(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(this.baseUrl);
  }

  create(request: CreateAppointmentRequest): Observable<Appointment> {
    return this.http.post<Appointment>(this.baseUrl, request);
  }

  cancel(publicId: string): Observable<Appointment> {
    return this.http.patch<Appointment>(`${this.baseUrl}/${publicId}/cancel`, {});
  }
}
