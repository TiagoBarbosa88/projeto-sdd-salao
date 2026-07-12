import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';

const TOKEN_KEY = 'salao_token';

export interface AuthUser {
  publicId: string;
  email: string;
  name: string;
}

export interface AuthTenant {
  publicId: string;
  name: string;
  slug: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
  tenant: AuthTenant;
  role: string;
}

export interface MeResponse {
  user: AuthUser;
  tenant: AuthTenant;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>('/api/v1/auth/login', { email, password })
      .pipe(tap((response) => localStorage.setItem(TOKEN_KEY, response.token)));
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  getMe(): Observable<MeResponse> {
    return this.http.get<MeResponse>('/api/v1/auth/me');
  }
}
