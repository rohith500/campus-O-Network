import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { map, Observable, tap } from 'rxjs';

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: string;
}

export interface FeedPost {
  id: string;
  name: string;
  description: string;
}

export interface FeedResponse {
  posts: FeedPost[];
}

interface FeedApiItem {
  id?: number | string;
  user_id?: number;
  name?: string;
  description?: string;
  content?: string;
}

const TOKEN_KEY = 'campusnet_token';
const USER_KEY = 'campusnet_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiBase = 'http://localhost:8079';
  private readonly loginUrl = `${this.apiBase}/auth/login`;
  private readonly registerUrl = `${this.apiBase}/auth/register`;
  private readonly feedUrl = `${this.apiBase}/feed`;

  constructor(
    private http: HttpClient,
    private router: Router,
  ) { }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(this.loginUrl, { email, password })
      .pipe(
        tap((res) => {
          localStorage.setItem(TOKEN_KEY, res.token);
          localStorage.setItem(USER_KEY, JSON.stringify(res.user));
        }),
      );
  }

  register(name: string, email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(this.registerUrl, { name, email, password })
      .pipe(
        tap((res) => {
          localStorage.setItem(TOKEN_KEY, res.token);
          localStorage.setItem(USER_KEY, JSON.stringify(res.user));
        }),
      );
  }

  getFeed(): Observable<FeedResponse> {
    return this.http.get<FeedResponse | FeedApiItem[]>(this.feedUrl).pipe(
      map((response) => {
        const rawItems = Array.isArray(response) ? response : (response.posts ?? []);
        return {
          posts: rawItems.map((item, index) => this.mapFeedItem(item, index)),
        };
      }),
    );
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  getCurrentUser(): AuthUser | null {
    const rawUser = localStorage.getItem(USER_KEY);
    if (!rawUser) return null;
    try {
      return JSON.parse(rawUser) as AuthUser;
    } catch {
      return null;
    }
  }

  getCurrentUserRole(): string | null {
    const userRole = this.getCurrentUser()?.role;
    if (userRole) return userRole;

    const token = this.getToken();
    if (!token) return null;

    const payload = token.split('.')[1];
    if (!payload) return null;

    try {
      const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as {
        role?: string;
      };
      return decoded.role ?? null;
    } catch {
      return null;
    }
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.router.navigate(['/auth/login']);
  }

  private mapFeedItem(item: FeedApiItem, index: number): FeedPost {
    return {
      id: String(item.id ?? index),
      name: item.name ?? `User #${item.user_id ?? 'Unknown'}`,
      description: item.description ?? item.content ?? '',
    };
  }
}

