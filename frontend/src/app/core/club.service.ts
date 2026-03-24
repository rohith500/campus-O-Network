import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, Observable } from 'rxjs';

export interface Club {
  id: number;
  name: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ClubRequest {
  name: string;
  description: string;
  category?: string;
  tags?: string;
  imageUrl?: string;
}

interface ClubResponse {
  ok: boolean;
  club: APIClub;
}

interface APIClub {
  id?: number;
  name?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  ID?: number;
  Name?: string;
  Description?: string;
  CreatedAt?: string;
  UpdatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class ClubService {
  private readonly apiBase = 'http://localhost:8079';

  constructor(private http: HttpClient) {}

  createClub(payload: ClubRequest, token: string): Observable<ClubResponse> {
    return this.http
      .post<ClubResponse>(`${this.apiBase}/clubs`, payload, {
        headers: this.authHeaders(token),
      })
      .pipe(map((res) => ({ ...res, club: this.normalizeClub(res.club) })));
  }

  getClub(id: number): Observable<ClubResponse> {
    return this.http
      .get<ClubResponse>(`${this.apiBase}/clubs/${id}`)
      .pipe(map((res) => ({ ...res, club: this.normalizeClub(res.club) })));
  }

  updateClub(id: number, payload: ClubRequest, token: string): Observable<ClubResponse> {
    return this.http
      .put<ClubResponse>(`${this.apiBase}/clubs/${id}`, payload, {
        headers: this.authHeaders(token),
      })
      .pipe(map((res) => ({ ...res, club: this.normalizeClub(res.club) })));
  }

  private authHeaders(token: string): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  private normalizeClub(club: APIClub): Club {
    return {
      id: club.id ?? club.ID ?? 0,
      name: club.name ?? club.Name ?? '',
      description: club.description ?? club.Description ?? '',
      createdAt: club.createdAt ?? club.CreatedAt,
      updatedAt: club.updatedAt ?? club.UpdatedAt,
    };
  }
}
