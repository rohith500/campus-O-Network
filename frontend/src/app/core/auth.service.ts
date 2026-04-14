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
  id: number;
  userId: number;
  name: string;
  description: string;
  likes: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface FeedResponse {
  posts: FeedPost[];
}

interface FeedApiItem {
  AuthorName?: string;
  id?: number | string;
  ID?: number | string;
  user_id?: number;
  userId?: number;
  UserID?: number;
  name?: string;
  Name?: string;
  description?: string;
  content?: string;
  Content?: string;
  likes?: number;
  Likes?: number;
  created_at?: string;
  createdAt?: string;
  CreatedAt?: string;
  updated_at?: string;
  updatedAt?: string;
  UpdatedAt?: string;
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

  updateCurrentUserName(name: string): void {
    const trimmed = name.trim();
    if (!trimmed) return;

    const current = this.getCurrentUser();
    if (!current) return;

    localStorage.setItem(USER_KEY, JSON.stringify({ ...current, name: trimmed }));
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
    const numericId = Number(item.id ?? item.ID ?? index);
    const userId = Number(item.user_id ?? item.userId ?? item.UserID ?? 0);
    return {
      id: Number.isNaN(numericId) ? index : numericId,
      userId,
      name: item.AuthorName ?? item.name ?? item.Name ?? `User #${userId || 'Unknown'}`,
      description: item.description ?? item.content ?? item.Content ?? '',
      likes: Number(item.likes ?? item.Likes ?? 0),
      createdAt: item.created_at ?? item.createdAt ?? item.CreatedAt,
      updatedAt: item.updated_at ?? item.updatedAt ?? item.UpdatedAt,
    };
  }
}

