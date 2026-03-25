import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, Observable } from 'rxjs';

export interface EventFormPayload {
    clubId?: number;
    title: string;
    description: string;
    location: string;
    startDateIso: string;
    endDateIso?: string;
    capacity?: number;
}

export interface EventModel {
    id: number;
    clubId: number;
    creatorId: number;
    title: string;
    description: string;
    date: string;
    location: string;
    capacity: number;
    createdAt?: string;
    updatedAt?: string;
}

interface ApiEvent {
    id?: number;
    clubId?: number;
    creatorId?: number;
    title?: string;
    description?: string;
    date?: string;
    location?: string;
    capacity?: number;
    createdAt?: string;
    updatedAt?: string;
    ID?: number;
    ClubID?: number;
    CreatorID?: number;
    Title?: string;
    Description?: string;
    Date?: string;
    Location?: string;
    Capacity?: number;
    CreatedAt?: string;
    UpdatedAt?: string;
}

interface EventResponse {
    ok: boolean;
    event: ApiEvent;
}

interface EventDetailResponse {
    ok: boolean;
    event: ApiEvent;
    rsvps?: Array<{
        userId?: number;
        status?: string;
        UserID?: number;
        Status?: string;
    }>;
}

interface EventListResponse {
    ok: boolean;
    events: ApiEvent[];
}

@Injectable({ providedIn: 'root' })
export class EventService {
    private readonly apiBase = 'http://localhost:8079';

    constructor(private readonly http: HttpClient) { }

    createEvent(payload: EventFormPayload, token: string): Observable<EventModel> {
        return this.http
            .post<EventResponse>(`${this.apiBase}/events`, this.toBackendPayload(payload), {
                headers: this.authHeaders(token),
            })
            .pipe(map((response) => this.normalizeEvent(response.event)));
    }

    getEvent(eventId: number): Observable<EventModel> {
        return this.http
            .get<EventDetailResponse>(`${this.apiBase}/events/${eventId}`)
            .pipe(map((response) => this.normalizeEvent(response.event)));
    }

    listEvents(clubId?: number): Observable<EventModel[]> {
        const query = clubId && clubId > 0 ? `?club_id=${clubId}` : '';
        return this.http
            .get<EventListResponse>(`${this.apiBase}/events${query}`)
            .pipe(map((response) => (response.events ?? []).map((event) => this.normalizeEvent(event))));
    }

    getEventRsvpStatus(eventId: number, userId: number): Observable<'going' | 'maybe' | 'not_going' | 'none'> {
        return this.http
            .get<EventDetailResponse>(`${this.apiBase}/events/${eventId}`)
            .pipe(
                map((response) => {
                    const rsvp = (response.rsvps ?? []).find((entry) => {
                        const entryUserId = entry.userId ?? entry.UserID ?? 0;
                        return entryUserId === userId;
                    });
                    const normalized = String(rsvp?.status ?? rsvp?.Status ?? '').toLowerCase();
                    if (normalized === 'going') return 'going';
                    if (normalized === 'maybe') return 'maybe';
                    if (normalized === 'not_going') return 'not_going';
                    return 'none';
                }),
            );
    }

    updateEvent(eventId: number, payload: EventFormPayload, token: string): Observable<EventModel> {
        return this.http
            .put<EventResponse>(`${this.apiBase}/events/${eventId}`, this.toBackendPayload(payload), {
                headers: this.authHeaders(token),
            })
            .pipe(map((response) => this.normalizeEvent(response.event)));
    }

    deleteEvent(eventId: number, token: string): Observable<void> {
        return this.http.delete<void>(`${this.apiBase}/events/${eventId}`, {
            headers: this.authHeaders(token),
        });
    }

    toListErrorMessage(error: unknown): string {
        if (typeof error === 'object' && error && 'status' in error) {
            const status = Number((error as { status?: number }).status ?? 0);
            if (status === 0) {
                return 'Cannot reach the server. Please verify the backend is running.';
            }
            if (status === 404) {
                return 'Events endpoint was not found on the backend.';
            }
            if (status >= 500) {
                return 'The server failed while loading events. Please try again shortly.';
            }
        }
        return 'Failed to load events.';
    }

    private toBackendPayload(payload: EventFormPayload): Record<string, unknown> {
        return {
            clubId: payload.clubId ?? 0,
            title: payload.title,
            description: payload.description,
            location: payload.location,
            date: payload.startDateIso,
            capacity: payload.capacity,
            endDate: payload.endDateIso,
        };
    }

    private authHeaders(token: string): HttpHeaders {
        return new HttpHeaders({ Authorization: `Bearer ${token}` });
    }

    private normalizeEvent(event: ApiEvent): EventModel {
        return {
            id: event.id ?? event.ID ?? 0,
            clubId: event.clubId ?? event.ClubID ?? 0,
            creatorId: event.creatorId ?? event.CreatorID ?? 0,
            title: event.title ?? event.Title ?? '',
            description: event.description ?? event.Description ?? '',
            date: event.date ?? event.Date ?? '',
            location: event.location ?? event.Location ?? '',
            capacity: event.capacity ?? event.Capacity ?? 0,
            createdAt: event.createdAt ?? event.CreatedAt,
            updatedAt: event.updatedAt ?? event.UpdatedAt,
        };
    }
}
