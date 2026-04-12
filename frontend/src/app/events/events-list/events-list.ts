import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/auth.service';
import { EventModel, EventService } from '../../core/event.service';

interface EventListItem extends EventModel {
    rsvpStatus: 'going' | 'maybe' | 'not_going' | 'none';
}

@Component({
    selector: 'app-events-list',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterLink,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
    ],
    templateUrl: './events-list.html',
    styleUrl: './events-list.css',
})
export class EventsList implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly eventsService = inject(EventService);
    private readonly auth = inject(AuthService);
    private readonly router = inject(Router);

    loading = signal(true);
    errorMessage = signal('');
    events = signal<EventListItem[]>([]);
    canCreateEvents = signal(false);
    rsvpPendingByEventId = signal<Record<number, boolean>>({});
    rsvpErrorByEventId = signal<Record<number, string>>({});

    readonly filtersForm = this.fb.nonNullable.group({
        upcomingOnly: true,
        startDate: '',
        endDate: '',
        clubId: '',
        organizerId: '',
    });

    readonly filteredEvents = computed(() => {
        const filters = this.filtersForm.getRawValue();
        const startDateMs = filters.startDate ? new Date(`${filters.startDate}T00:00:00`).getTime() : null;
        const endDateMs = filters.endDate ? new Date(`${filters.endDate}T23:59:59`).getTime() : null;
        const clubId = filters.clubId.trim();
        const organizerId = filters.organizerId.trim();

        return this.events().filter((event) => {
            const eventDateMs = new Date(event.date).getTime();
            if (Number.isNaN(eventDateMs)) {
                return true;
            }

            if (filters.upcomingOnly && eventDateMs < Date.now()) {
                return false;
            }
            if (startDateMs !== null && eventDateMs < startDateMs) {
                return false;
            }
            if (endDateMs !== null && eventDateMs > endDateMs) {
                return false;
            }
            if (clubId && String(event.clubId) !== clubId) {
                return false;
            }
            if (organizerId && String(event.creatorId) !== organizerId) {
                return false;
            }
            return true;
        });
    });

    ngOnInit(): void {
        const role = this.auth.getCurrentUserRole();
        this.canCreateEvents.set(role === 'admin' || role === 'ambassador' || role === 'organizer' || role === 'club_admin');
        this.loadEvents();
    }

    loadEvents(): void {
        this.loading.set(true);
        this.errorMessage.set('');

        this.eventsService.listEvents().subscribe({
            next: (events) => {
                const sorted = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                const currentUserId = this.auth.getCurrentUser()?.id ?? null;

                if (!currentUserId || sorted.length === 0) {
                    this.events.set(sorted.map((event) => ({ ...event, rsvpStatus: 'none' })));
                    this.loading.set(false);
                    return;
                }

                const rsvpRequests = sorted.map((event) =>
                    this.eventsService.getEventRsvpStatus(event.id, currentUserId).pipe(catchError(() => of('none' as const))),
                );

                forkJoin(rsvpRequests).subscribe({
                    next: (statuses) => {
                        const enriched = sorted.map((event, index) => ({
                            ...event,
                            rsvpStatus: statuses[index],
                        }));
                        this.events.set(enriched);
                        this.loading.set(false);
                    },
                    error: () => {
                        this.events.set(sorted.map((event) => ({ ...event, rsvpStatus: 'none' })));
                        this.loading.set(false);
                    },
                });
            },
            error: (error) => {
                this.loading.set(false);
                this.errorMessage.set(this.eventsService.toListErrorMessage(error));
            },
        });
    }

    clearFilters(): void {
        this.filtersForm.setValue({
            upcomingOnly: true,
            startDate: '',
            endDate: '',
            clubId: '',
            organizerId: '',
        });
    }

    formatEventDate(dateValue: string): string {
        const parsed = new Date(dateValue);
        if (Number.isNaN(parsed.getTime())) {
            return 'Date TBD';
        }
        return parsed.toLocaleString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            timeZoneName: 'short',
        });
    }

    rsvpLabel(status: EventListItem['rsvpStatus']): string {
        if (status === 'going') return 'RSVP: Going';
        if (status === 'maybe') return 'RSVP: Maybe';
        if (status === 'not_going') return 'RSVP: Not Going';
        return 'RSVP: None';
    }

    setRsvp(eventId: number, status: 'going' | 'maybe' | 'not_going'): void {
        if (this.isRsvpPending(eventId)) {
            return;
        }

        const token = this.auth.getToken();
        if (!token) {
            this.router.navigate(['/auth/login']);
            return;
        }

        const current = this.events().find((event) => event.id === eventId);
        if (!current) {
            return;
        }

        const previousStatus = current.rsvpStatus;
        this.updateEventRsvpStatus(eventId, status);
        this.setRsvpPending(eventId, true);
        this.setRsvpError(eventId, '');

        this.eventsService.rsvpEvent(eventId, status, token).subscribe({
            next: () => {
                this.setRsvpPending(eventId, false);
                this.setRsvpError(eventId, '');
            },
            error: (error: HttpErrorResponse) => {
                this.updateEventRsvpStatus(eventId, previousStatus);
                this.setRsvpPending(eventId, false);
                this.setRsvpError(eventId, this.toRsvpErrorMessage(error));

                if (error.status === 401) {
                    this.router.navigate(['/auth/login']);
                }
            },
        });
    }

    isRsvpPending(eventId: number): boolean {
        return !!this.rsvpPendingByEventId()[eventId];
    }

    rsvpError(eventId: number): string {
        return this.rsvpErrorByEventId()[eventId] ?? '';
    }

    isRsvpSelected(eventId: number, status: 'going' | 'maybe' | 'not_going'): boolean {
        return this.events().some((event) => event.id === eventId && event.rsvpStatus === status);
    }

    private updateEventRsvpStatus(eventId: number, status: EventListItem['rsvpStatus']): void {
        this.events.update((events) =>
            events.map((event) =>
                event.id === eventId
                    ? {
                        ...event,
                        rsvpStatus: status,
                    }
                    : event,
            ),
        );
    }

    private setRsvpPending(eventId: number, pending: boolean): void {
        this.rsvpPendingByEventId.update((state) => ({
            ...state,
            [eventId]: pending,
        }));
    }

    private setRsvpError(eventId: number, message: string): void {
        this.rsvpErrorByEventId.update((state) => ({
            ...state,
            [eventId]: message,
        }));
    }

    private toRsvpErrorMessage(error: HttpErrorResponse): string {
        if (error.status === 400) {
            return 'Invalid RSVP status. Please choose Going, Maybe, or Not Going.';
        }
        if (error.status === 401) {
            return 'Your session has expired. Please sign in again.';
        }
        if (error.status === 404) {
            return 'Event not found. It may have been removed.';
        }
        return 'Failed to save RSVP. Please try again.';
    }
}
