import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: 'candidate' | 'recruiter';
}

export interface LoginPayload {
  email: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/auth`;

  register(user: RegisterPayload): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/register`, {
      name: user.name.trim(),
      email: user.email.trim().toLowerCase(),
      password: user.password,
      role: user.role || 'candidate',
    });
  }

  login(credentials: LoginPayload): Observable<any> {
    return this.http
      .post(`${this.apiUrl}/login`, {
        email: credentials.email.trim().toLowerCase(),
        password: credentials.password,
      })
      .pipe(
        tap((res: any) => {
          if (res.token) {
            localStorage.setItem('token', res.token);
            localStorage.setItem('role', res.role);
            localStorage.setItem('name', res.name || '');
          }
        })
      );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('name');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  /** Extrait le message d'erreur renvoyé par l'API (Joi ou controller) */
  static formatHttpError(err: any, fallback: string): string {
    const body = err?.error;
    if (typeof body === 'string') return body;
    if (body?.message) return body.message;
    if (Array.isArray(body?.errors) && body.errors.length) {
      return body.errors.join(' ');
    }
    return err?.message || fallback;
  }
}
