import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
  };
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

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiBase = 'http://localhost:8079';
  private readonly loginUrl = `${this.apiBase}/auth/login`;
  private readonly registerUrl = `${this.apiBase}/auth/register`;
  private readonly feedUrl = `${this.apiBase}/feed`;

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(this.loginUrl, { email, password })
      .pipe(tap((res) => localStorage.setItem(TOKEN_KEY, res.token)));
  }

  register(name: string, email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(this.registerUrl, { name, email, password })
      .pipe(tap((res) => localStorage.setItem(TOKEN_KEY, res.token)));
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

