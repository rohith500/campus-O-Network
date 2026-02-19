import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

export interface AuthResponse {
  success: boolean;
  token: string;
}

export interface FeedPost {
  id: string;
  name: string;
  description: string;
}

export interface FeedResponse {
  posts: FeedPost[];
}

const TOKEN_KEY = 'campusnet_token';

// Use text/plain to avoid CORS preflight (simple request).
// The mock API accepts any body format.
const plainHeaders = new HttpHeaders({ 'Content-Type': 'text/plain' });

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly loginUrl = 'https://mocka.ouim.me/mock/9d0c668f/api/login';
  private readonly registerUrl = 'https://mocka.ouim.me/mock/08ff61a4/api/register';
  private readonly feedUrl = 'https://mocka.ouim.me/mock/f1b51d68/api/feed';

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(this.loginUrl, JSON.stringify({ email, password }), {
        headers: plainHeaders,
      })
      .pipe(tap((res) => { if (res.success) localStorage.setItem(TOKEN_KEY, res.token); }));
  }

  register(body: Record<string, unknown>): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(this.registerUrl, JSON.stringify(body), {
        headers: plainHeaders,
      })
      .pipe(tap((res) => { if (res.success) localStorage.setItem(TOKEN_KEY, res.token); }));
  }

  getFeed(): Observable<FeedResponse> {
    return this.http.get<FeedResponse>(this.feedUrl);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    this.router.navigate(['/auth/login']);
  }
}

