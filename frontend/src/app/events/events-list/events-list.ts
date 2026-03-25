import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
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

  loading = signal(true);
  errorMessage = signal('');
  events = signal<EventListItem[]>([]);
  canCreateEvents = signal(false);

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
}
