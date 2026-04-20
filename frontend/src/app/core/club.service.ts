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
  members?: ClubMember[];
}

interface ClubsResponse {
  ok: boolean;
  clubs: APIClub[];
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

export interface ClubMember {
  UserName?: string;
  user_name?: string;
  id: number;
  club_id?: number;
  user_id?: number;
  role?: string;
  joined_at?: string;
  ClubID?: number;
  UserID?: number;
  Role?: string;
  JoinedAt?: string;
}

export interface ClubDetailResponse {
  ok: boolean;
  club: Club;
  members: ClubMember[];
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

  listClubs(): Observable<Club[]> {
    return this.http
      .get<ClubsResponse>(`${this.apiBase}/clubs`)
      .pipe(map((res) => (res.clubs ?? []).map((club) => this.normalizeClub(club))));
  }

  getClubDetail(id: number): Observable<ClubDetailResponse> {
    return this.http.get<ClubResponse>(`${this.apiBase}/clubs/${id}`).pipe(
      map((res) => ({
        ok: res.ok,
        club: this.normalizeClub(res.club),
        members: this.normalizeMembers(res.members),
      })),
    );
  }

  updateClub(id: number, payload: ClubRequest, token: string): Observable<ClubResponse> {
    return this.http
      .put<ClubResponse>(`${this.apiBase}/clubs/${id}`, payload, {
        headers: this.authHeaders(token),
      })
      .pipe(map((res) => ({ ...res, club: this.normalizeClub(res.club) })));
  }

  joinClub(clubId: number, token: string, role = 'member'): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(
      `${this.apiBase}/clubs/${clubId}/join`,
      { role },
      { headers: this.authHeaders(token) },
    );
  }

  leaveClub(clubId: number, token: string): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${this.apiBase}/clubs/${clubId}/leave`, {
      headers: this.authHeaders(token),
    });
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

  private normalizeMembers(members?: ClubMember[]): ClubMember[] {
    if (!Array.isArray(members)) return [];

    return members.map((member) => ({
      ...member,
      club_id: member.club_id ?? member.ClubID,
      user_id: member.user_id ?? member.UserID,
      role: member.role ?? member.Role,
      joined_at: member.joined_at ?? member.JoinedAt,
    }));
  }
}
