import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, signal } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/auth.service';
import { EventFormPayload, EventModel, EventService } from '../../core/event.service';

@Component({
    selector: 'app-event-form',
    imports: [
        CommonModule,
        RouterModule,
        ReactiveFormsModule,
        MatToolbarModule,
        MatButtonModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
        MatProgressSpinnerModule,
    ],
    templateUrl: './event-form.html',
    styleUrl: './event-form.css',
})
export class EventForm implements OnInit {
    loading = signal(false);
    initializing = signal(false);
    isEditMode = signal(false);
    formError = signal('');
    fieldErrors = signal<Record<string, string>>({});
    backendSupportsEdit = signal(true);
    backendSupportsDelete = signal(true);
    private editEventId: number | null = null;

    readonly form: FormGroup;
    readonly canSubmit = computed(() => !this.loading());

    constructor(
        private readonly fb: FormBuilder,
        private readonly auth: AuthService,
        private readonly events: EventService,
        private readonly route: ActivatedRoute,
        private readonly router: Router,
    ) {
        this.form = this.fb.group(
            {
                title: ['', [Validators.minLength(2), Validators.maxLength(120)]],
                description: ['', [Validators.maxLength(1000)]],
                startDate: [''],
                endDate: [''],
                location: ['', [Validators.maxLength(120)]],
                clubId: [''],
                capacity: [''],
            },
            { validators: [this.dateRangeValidator] },
        );
    }

    ngOnInit(): void {
        const idParam = this.route.snapshot.paramMap.get('id');
        if (!idParam) {
            return;
        }

        const parsedId = Number(idParam);
        if (Number.isNaN(parsedId) || parsedId <= 0) {
            this.formError.set('Invalid event id.');
            return;
        }

        this.editEventId = parsedId;
        this.isEditMode.set(true);
        this.initializing.set(true);

        this.events.getEvent(parsedId).subscribe({
            next: (event) => {
                this.prefillForm(event);
                this.initializing.set(false);
            },
            error: (error: HttpErrorResponse) => {
                this.initializing.set(false);
                this.formError.set(this.toUserMessage(error, false));
            },
        });
    }

    onSubmit(): void {
        const token = this.auth.getToken();
        if (!token) {
            this.router.navigate(['/auth/login']);
            return;
        }

        if (this.isEditMode() && !this.backendSupportsEdit()) {
            this.formError.set('Editing events is not supported by the current backend routes.');
            return;
        }

        this.loading.set(true);
        this.formError.set('');
        this.fieldErrors.set({});

        const payload = this.buildPayload();
        const request$ = this.isEditMode() && this.editEventId
            ? this.events.updateEvent(this.editEventId, payload, token)
            : this.events.createEvent(payload, token);

        request$.subscribe({
            next: () => {
                this.loading.set(false);
                const successMessage = this.isEditMode()
                    ? 'Event updated successfully.'
                    : 'Event created successfully.';
                window.alert(successMessage);
                this.router.navigate(['/feed']);
            },
            error: (error: HttpErrorResponse) => {
                this.loading.set(false);
                this.applyBackendErrors(error, true);
            },
        });
    }

    onDelete(): void {
        if (!this.isEditMode() || !this.editEventId) {
            return;
        }

        const confirmed = window.confirm('Delete this event? This action cannot be undone.');
        if (!confirmed) {
            return;
        }

        const token = this.auth.getToken();
        if (!token) {
            this.router.navigate(['/auth/login']);
            return;
        }

        this.loading.set(true);
        this.formError.set('');

        this.events.deleteEvent(this.editEventId, token).subscribe({
            next: () => {
                this.loading.set(false);
                this.router.navigate(['/feed']);
            },
            error: (error: HttpErrorResponse) => {
                this.loading.set(false);
                this.applyBackendErrors(error, false);
            },
        });
    }

    private prefillForm(event: EventModel): void {
        const startDate = event.date ? new Date(event.date) : new Date();
        const endDate = new Date(startDate);

        this.form.patchValue({
            title: event.title,
            description: event.description,
            startDate: this.toDateLocal(startDate),
            endDate: this.toDateLocal(endDate),
            location: event.location,
            clubId: event.clubId > 0 ? String(event.clubId) : '',
            capacity: event.capacity > 0 ? String(event.capacity) : '',
        });
    }

    private buildPayload(): EventFormPayload {
        const startDate = String(this.form.value.startDate ?? '');
        const endDate = String(this.form.value.endDate ?? '');
        const clubIdRaw = String(this.form.value.clubId ?? '').trim();
        const capacityRaw = String(this.form.value.capacity ?? '').trim();

        const clubId = clubIdRaw ? Number.parseInt(clubIdRaw, 10) : undefined;
        const capacity = capacityRaw ? Number.parseInt(capacityRaw, 10) : undefined;

        return {
            title: String(this.form.value.title ?? '').trim(),
            description: String(this.form.value.description ?? '').trim(),
            location: String(this.form.value.location ?? '').trim(),
            startDateIso: this.toIsoDate(startDate),
            endDateIso: endDate ? this.toIsoDate(endDate) : undefined,
            clubId: clubId && clubId > 0 ? clubId : undefined,
            capacity: capacity && capacity > 0 ? capacity : undefined,
        };
    }

    private applyBackendErrors(error: HttpErrorResponse, fromSubmit: boolean): void {
        const message = this.toUserMessage(error, fromSubmit);
        const lower = message.toLowerCase();

        const nextFieldErrors: Record<string, string> = {};
        if (lower.includes('title')) {
            nextFieldErrors['title'] = message;
        } else if (lower.includes('date')) {
            nextFieldErrors['startDate'] = message;
            nextFieldErrors['endDate'] = message;
        } else if (lower.includes('capacity')) {
            nextFieldErrors['capacity'] = message;
        } else if (lower.includes('location')) {
            nextFieldErrors['location'] = message;
        }

        if (Object.keys(nextFieldErrors).length > 0) {
            this.fieldErrors.set(nextFieldErrors);
        } else {
            this.formError.set(message);
        }

        if (error.status === 405 || error.status === 404) {
            if (this.isEditMode()) {
                this.backendSupportsEdit.set(false);
                this.backendSupportsDelete.set(false);
            }
        }
    }

    private toUserMessage(error: HttpErrorResponse, fromSubmit: boolean): string {
        const serverMessage = typeof error.error === 'string' && error.error.trim().length > 0
            ? error.error.trim()
            : '';

        if (error.status === 401 || error.status === 403) {
            return 'You do not have permission to perform this event action.';
        }
        if (error.status === 404 && this.isEditMode() && !fromSubmit) {
            return 'Event not found.';
        }
        if (error.status === 405) {
            return this.isEditMode()
                ? 'Editing/deleting events is not supported by the current backend routes.'
                : 'This action is not supported by the backend.';
        }
        if (serverMessage) {
            return serverMessage;
        }
        return 'Failed to save event. Please try again.';
    }

    private dateRangeValidator(control: AbstractControl): ValidationErrors | null {
        const startValue = control.get('startDate')?.value;
        const endValue = control.get('endDate')?.value;
        if (!startValue) {
            return null;
        }
        if (!endValue) {
            return null;
        }

        const startTime = new Date(`${startValue}T00:00:00`).getTime();
        const endTime = new Date(`${endValue}T00:00:00`).getTime();
        if (Number.isNaN(startTime) || Number.isNaN(endTime)) {
            return { invalidDate: true };
        }
        if (endTime <= startTime) {
            return { dateOrder: true };
        }
        return null;
    }

    private toDateLocal(date: Date): string {
        const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000);
        return localDate.toISOString().slice(0, 10);
    }

    private toIsoDate(dateInput: string): string {
        return `${dateInput}T00:00:00Z`;
    }
}
