import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { API_BASE_URL } from './api.config';
import { ApiResult, PaginatedResult, PaginationParams } from './api.types';
import { applyClientPagination, buildHttpParams, mapToApiResult } from './api.utils';

export interface Club {
  id: number;
  name: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ClubMember {
  id: number;
  clubId: number;
  userId: number;
  role: string;
  joinedAt?: string;
}

export interface ClubDetail {
  club: Club;
  members: ClubMember[];
}

export interface ClubCreateInput {
  name: string;
  description: string;
}

export interface ClubUpdateInput {
  name?: string;
  description?: string;
}

export interface ClubListQuery extends PaginationParams {
  search?: string;
  category?: string;
  tags?: string;
}

interface ClubsResponse {
  ok: boolean;
  clubs: ApiClub[];
}

interface ClubResponse {
  ok: boolean;
  club: ApiClub;
  members?: ApiClubMember[];
}

interface ApiClub {
  id?: number;
  ID?: number;
  name?: string;
  Name?: string;
  description?: string;
  Description?: string;
  createdAt?: string;
  CreatedAt?: string;
  updatedAt?: string;
  UpdatedAt?: string;
}

interface ApiClubMember {
  id?: number;
  club_id?: number;
  ClubID?: number;
  user_id?: number;
  UserID?: number;
  role?: string;
  Role?: string;
  joined_at?: string;
  JoinedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class ClubsApiService {
  private readonly baseUrl = `${API_BASE_URL}/clubs`;

  constructor(private http: HttpClient) {}

  list(query?: ClubListQuery): Observable<ApiResult<PaginatedResult<Club>>> {
    const params = buildHttpParams({});

    const source$ = this.http.get<ClubsResponse>(this.baseUrl, { params }).pipe(
      map((res) => (res.clubs ?? []).map((club) => this.normalizeClub(club))),
      map((clubs) => this.applyClientFilters(clubs, query)),
      map((clubs) => applyClientPagination(clubs, query)),
    );

    return mapToApiResult(source$);
  }

  getById(id: number): Observable<ApiResult<ClubDetail>> {
    const source$ = this.http.get<ClubResponse>(`${this.baseUrl}/${id}`).pipe(
      map((res) => ({
        club: this.normalizeClub(res.club),
        members: (res.members ?? []).map((member) => this.normalizeMember(member)),
      })),
    );

    return mapToApiResult(source$);
  }

  create(input: ClubCreateInput): Observable<ApiResult<Club>> {
    const source$ = this.http
      .post<ClubResponse>(this.baseUrl, input)
      .pipe(map((res) => this.normalizeClub(res.club)));

    return mapToApiResult(source$);
  }

  update(id: number, input: ClubUpdateInput): Observable<ApiResult<Club>> {
    const source$ = this.http
      .put<ClubResponse>(`${this.baseUrl}/${id}`, input)
      .pipe(map((res) => this.normalizeClub(res.club)));

    return mapToApiResult(source$);
  }

  delete(id: number): Observable<ApiResult<{ deleted: boolean }>> {
    const source$ = this.http
      .delete<{ ok?: boolean }>(`${this.baseUrl}/${id}`)
      .pipe(map(() => ({ deleted: true })));

    return mapToApiResult(source$);
  }

  join(clubId: number, role = 'member'): Observable<ApiResult<{ joined: boolean }>> {
    const source$ = this.http
      .post<{ ok?: boolean }>(`${this.baseUrl}/${clubId}/join`, { role })
      .pipe(map(() => ({ joined: true })));

    return mapToApiResult(source$);
  }

  leave(clubId: number): Observable<ApiResult<{ left: boolean }>> {
    const source$ = this.http
      .delete<{ ok?: boolean }>(`${this.baseUrl}/${clubId}/leave`)
      .pipe(map(() => ({ left: true })));

    return mapToApiResult(source$);
  }

  private normalizeClub(club: ApiClub): Club {
    return {
      id: club.id ?? club.ID ?? 0,
      name: club.name ?? club.Name ?? '',
      description: club.description ?? club.Description ?? '',
      createdAt: club.createdAt ?? club.CreatedAt,
      updatedAt: club.updatedAt ?? club.UpdatedAt,
    };
  }

  private normalizeMember(member: ApiClubMember): ClubMember {
    return {
      id: member.id ?? 0,
      clubId: member.club_id ?? member.ClubID ?? 0,
      userId: member.user_id ?? member.UserID ?? 0,
      role: member.role ?? member.Role ?? 'member',
      joinedAt: member.joined_at ?? member.JoinedAt,
    };
  }

  private applyClientFilters(clubs: Club[], query?: ClubListQuery): Club[] {
    if (!query) return clubs;

    const search = query.search?.toLowerCase().trim();
    const category = query.category?.toLowerCase().trim();
    const tags = query.tags?.toLowerCase().trim();

    return clubs.filter((club) => {
      const text = `${club.name} ${club.description}`.toLowerCase();
      const matchesSearch = !search || text.includes(search);
      const matchesCategory = !category || text.includes(category);
      const matchesTags = !tags || text.includes(tags);
      return matchesSearch && matchesCategory && matchesTags;
    });
  }
}
