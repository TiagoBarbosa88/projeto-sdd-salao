import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface SalonService {
  publicId: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: number;
  active: boolean;
}

export interface CreateServiceRequest {
  name: string;
  description?: string;
  durationMinutes: number;
  price: number;
}

export interface UpdateServiceRequest extends CreateServiceRequest {
  active: boolean;
}

@Injectable({ providedIn: 'root' })
export class ServiceService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1/services';

  list(): Observable<SalonService[]> {
    return this.http.get<SalonService[]>(this.baseUrl);
  }

  get(publicId: string): Observable<SalonService> {
    return this.http.get<SalonService>(`${this.baseUrl}/${publicId}`);
  }

  create(request: CreateServiceRequest): Observable<SalonService> {
    return this.http.post<SalonService>(this.baseUrl, request);
  }

  update(publicId: string, request: UpdateServiceRequest): Observable<SalonService> {
    return this.http.put<SalonService>(`${this.baseUrl}/${publicId}`, request);
  }

  delete(publicId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${publicId}`);
  }
}
