import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface SalonSettings {
  publicId: string;
  name: string;
  slug: string;
  description?: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
  logoUrl?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  tiktokUrl?: string;
  websiteUrl?: string;
  youtubeUrl?: string;
  googleMapsUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoImageUrl?: string;
}

export interface UpdateSalonSettings {
  name: string;
  description?: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
  logoUrl?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  tiktokUrl?: string;
  websiteUrl?: string;
  youtubeUrl?: string;
  googleMapsUrl?: string;
}

export interface SchedulingSettings {
  zoneId: string;
  bufferMinutes: number;
  slotIntervalMinutes: number;
  dayStartTime: string;
  dayEndTime: string;
}

export interface UpdateSchedulingSettings {
  zoneId: string;
  bufferMinutes: number;
  slotIntervalMinutes: number;
  dayStartTime: string;
  dayEndTime: string;
}

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1/settings';

  getSalonSettings(): Observable<SalonSettings> {
    return this.http.get<SalonSettings>(`${this.baseUrl}/salon`);
  }

  updateSalonSettings(payload: UpdateSalonSettings): Observable<SalonSettings> {
    return this.http.put<SalonSettings>(`${this.baseUrl}/salon`, payload);
  }

  getSchedulingSettings(): Observable<SchedulingSettings> {
    return this.http.get<SchedulingSettings>(`${this.baseUrl}/scheduling`);
  }

  updateSchedulingSettings(payload: UpdateSchedulingSettings): Observable<SchedulingSettings> {
    return this.http.put<SchedulingSettings>(`${this.baseUrl}/scheduling`, payload);
  }
}
