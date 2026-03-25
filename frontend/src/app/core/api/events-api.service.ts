import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { API_BASE_URL } from './api.config';
import { ApiResult, PaginatedResult, PaginationParams } from './api.types';
import { applyClientPagination, buildHttpParams, mapToApiResult } from './api.utils';

export interface EventItem {
  id: number;
  clubId: number;
  creatorId: number;
  title: string;
  description: string;
  location: string;
  date: string;
  capacity: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface EventCreateInput {
  clubId: number;
  title: string;
  description: string;
  location: string;
  date: string;
  capacity: number;
}

export interface EventUpdateInput {
  title?: string;
  description?: string;
  location?: string;
  date?: string;
  capacity?: number;
}

export interface EventListQuery extends PaginationParams {
  clubId?: number;
  search?: string;
}

interface EventsResponse {
  ok: boolean;
  events: ApiEvent[];
}

interface EventResponse {
  ok: boolean;
  event: ApiEvent;
}

interface ApiEvent {
  id?: number;
  ID?: number;
  club_id?: number;
  ClubID?: number;
  creator_id?: number;
  CreatorID?: number;
  title?: string;
  Title?: string;
  description?: string;
  Description?: string;
  location?: string;
  Location?: string;
  date?: string;
  Date?: string;
  capacity?: number;
  Capacity?: number;
  created_at?: string;
  CreatedAt?: string;
  updated_at?: string;
  UpdatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class EventsApiService {
  private readonly baseUrl = `${API_BASE_URL}/events`;

  constructor(private http: HttpClient) {}

  list(query?: EventListQuery): Observable<ApiResult<PaginatedResult<EventItem>>> {
    const params = buildHttpParams({
      club_id: query?.clubId,
    });

    const source$ = this.http.get<EventsResponse>(this.baseUrl, { params }).pipe(
      map((res) => (res.events ?? []).map((event) => this.normalizeEvent(event))),
      map((events) => this.applySearch(events, query?.search)),
      map((events) => applyClientPagination(events, query)),
    );

    return mapToApiResult(source$);
  }

  getById(id: number): Observable<ApiResult<EventItem>> {
    const source$ = this.http
      .get<EventResponse>(`${this.baseUrl}/${id}`)
      .pipe(map((res) => this.normalizeEvent(res.event)));

    return mapToApiResult(source$);
  }

  create(input: EventCreateInput): Observable<ApiResult<EventItem>> {
    const source$ = this.http
      .post<EventResponse>(this.baseUrl, input)
      .pipe(map((res) => this.normalizeEvent(res.event)));

    return mapToApiResult(source$);
  }

  update(id: number, input: EventUpdateInput): Observable<ApiResult<EventItem>> {
    const source$ = this.http
      .put<EventResponse>(`${this.baseUrl}/${id}`, input)
      .pipe(map((res) => this.normalizeEvent(res.event)));

    return mapToApiResult(source$);
  }

  delete(id: number): Observable<ApiResult<{ deleted: boolean }>> {
    const source$ = this.http
      .delete<{ ok?: boolean }>(`${this.baseUrl}/${id}`)
      .pipe(map(() => ({ deleted: true })));

    return mapToApiResult(source$);
  }

  rsvp(id: number, status: 'going' | 'maybe' | 'not_going'): Observable<ApiResult<{ status: string }>> {
    const source$ = this.http
      .post<{ status: string }>(`${this.baseUrl}/${id}/rsvp`, { status })
      .pipe(map((res) => ({ status: res.status ?? status })));

    return mapToApiResult(source$);
  }

  private normalizeEvent(event: ApiEvent): EventItem {
    return {
      id: event.id ?? event.ID ?? 0,
      clubId: event.club_id ?? event.ClubID ?? 0,
      creatorId: event.creator_id ?? event.CreatorID ?? 0,
      title: event.title ?? event.Title ?? '',
      description: event.description ?? event.Description ?? '',
      location: event.location ?? event.Location ?? '',
      date: event.date ?? event.Date ?? '',
      capacity: event.capacity ?? event.Capacity ?? 0,
      createdAt: event.created_at ?? event.CreatedAt,
      updatedAt: event.updated_at ?? event.UpdatedAt,
    };
  }

  private applySearch(events: EventItem[], search?: string): EventItem[] {
    if (!search?.trim()) return events;
    const text = search.toLowerCase().trim();
    return events.filter((event) => `${event.title} ${event.description} ${event.location}`.toLowerCase().includes(text));
  }
}
