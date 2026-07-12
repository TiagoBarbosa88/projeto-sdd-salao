import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export type TeamRole = 'ADMIN' | 'EDITOR' | 'LEITOR' | 'PROFESSIONAL' | 'CLIENT';

export interface TeamMember {
  publicId: string;
  name: string;
  email: string;
  role: TeamRole;
  loginActive: boolean;
}

export interface Professional {
  publicId: string;
  name: string;
  email: string;
  phone?: string;
  role: TeamRole;
  bookable: boolean;
  active: boolean;
  loginActive: boolean;
}

export interface CreateTeamMember {
  name: string;
  email: string;
  password: string;
  phone?: string;
  bookable: boolean;
  role?: TeamRole;
}

export interface UpdateTeamMember {
  name?: string;
  phone?: string;
  bookable?: boolean;
  active?: boolean;
  role?: TeamRole;
  loginActive?: boolean;
  password?: string;
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

  updateTeamMember(publicId: string, payload: UpdateTeamMember): Observable<Professional> {
    return this.http.put<Professional>(`${this.baseUrl}/members/${publicId}/profile`, payload);
  }
}
