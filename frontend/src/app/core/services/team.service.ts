import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface TeamMember {
  publicId: string;
  name: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class TeamService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1/team';

  getMembers(role?: string): Observable<TeamMember[]> {
    const options = role ? { params: { role } } : {};
    return this.http.get<TeamMember[]>(`${this.baseUrl}/members`, options);
  }
}
