import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface TeamMember {
  publicId: string;
  name: string;
  role: string;
}

export interface Professional {
  publicId: string;
  name: string;
  phone?: string;
  bookable: boolean;
  active: boolean;
}

export interface CreateTeamMember {
  name: string;
  email: string;
  password: string;
  phone?: string;
  bookable: boolean;
}

export interface UpdateProfessionalProfile {
  phone?: string;
  bookable?: boolean;
  active?: boolean;
}

@Injectable({ providedIn: 'root' })
export class TeamService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1/team';

  getMembers(role?: string): Observable<TeamMember[]> {
    const options = role ? { params: { role } } : {};
    return this.http.get<TeamMember[]>(`${this.baseUrl}/members`, options);
  }

  listBookableProfessionals(): Observable<Professional[]> {
    return this.http.get<Professional[]>(`${this.baseUrl}/professionals`);
  }

  listAllProfessionalProfiles(): Observable<Professional[]> {
    return this.http.get<Professional[]>(`${this.baseUrl}/profiles`);
  }

  createProfessional(payload: CreateTeamMember): Observable<Professional> {
    return this.http.post<Professional>(`${this.baseUrl}/members`, payload);
  }

  updateProfessionalProfile(
    publicId: string,
    payload: UpdateProfessionalProfile
  ): Observable<Professional> {
    return this.http.put<Professional>(`${this.baseUrl}/members/${publicId}/profile`, payload);
  }
}
