import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface PublicTenant {
  publicId: string;
  name: string;
  slug: string;
}

export interface PublicService {
  publicId: string;
  name: string;
  description?: string;
  durationMinutes: number;
  price: number;
}

@Injectable({ providedIn: 'root' })
export class PublicSalonService {
  private readonly http = inject(HttpClient);

  getTenant(slug: string): Observable<PublicTenant> {
    return this.http.get<PublicTenant>(`/api/v1/public/tenants/${slug}`);
  }

  listServices(slug: string): Observable<PublicService[]> {
    return this.http.get<PublicService[]>(`/api/v1/public/tenants/${slug}/services`);
  }
}
