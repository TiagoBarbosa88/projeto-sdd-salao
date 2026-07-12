import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ServiceGender } from '../utils/service-image.util';

export interface PublicTenant {
  publicId: string;
  name: string;
  slug: string;
  description?: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
  businessHoursLines?: string[];
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

export interface PublicService {
  publicId: string;
  name: string;
  description?: string;
  durationMinutes: number;
  price: number;
  imageUrl?: string;
  gender?: ServiceGender;
}

export interface PublicProfessional {
  publicId: string;
  name: string;
}

export interface AvailabilitySlot {
  startAt: string;
  endAt: string;
}

export interface GuestBookingRequest {
  servicePublicId: string;
  professionalPublicId: string;
  startAt: string;
  guestName: string;
  guestPhone: string;
}

export interface GuestBookingResponse {
  publicId: string;
  startAt: string;
  endAt: string;
  guestName: string;
  status: string;
}

@Injectable({ providedIn: 'root' })
export class PublicSalonService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1/public/tenants';

  getTenant(slug: string): Observable<PublicTenant> {
    return this.http.get<PublicTenant>(`${this.baseUrl}/${slug}`);
  }

  listServices(slug: string): Observable<PublicService[]> {
    return this.http.get<PublicService[]>(`${this.baseUrl}/${slug}/services`);
  }

  listProfessionals(slug: string): Observable<PublicProfessional[]> {
    return this.http.get<PublicProfessional[]>(`${this.baseUrl}/${slug}/professionals`);
  }

  getAvailabilitySlots(
    slug: string,
    professionalPublicId: string,
    servicePublicId: string,
    date: string
  ): Observable<AvailabilitySlot[]> {
    const params = new HttpParams()
      .set('professionalPublicId', professionalPublicId)
      .set('servicePublicId', servicePublicId)
      .set('date', date);
    return this.http.get<AvailabilitySlot[]>(`${this.baseUrl}/${slug}/availability/slots`, {
      params,
    });
  }

  createGuestAppointment(
    slug: string,
    payload: GuestBookingRequest
  ): Observable<GuestBookingResponse> {
    return this.http.post<GuestBookingResponse>(`${this.baseUrl}/${slug}/appointments`, payload);
  }
}
