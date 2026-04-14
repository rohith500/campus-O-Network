import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { StudyGroupsService } from './study-groups.service';

@Component({
    selector: 'app-study-request-form',
    imports: [CommonModule, ReactiveFormsModule, RouterLink, MatButtonModule, MatIconModule, MatSnackBarModule],
    templateUrl: './study-request-form.html',
    styleUrl: './study-request-form.css',
})
export class StudyRequestForm {
    private readonly fb = inject(FormBuilder);
    private readonly service = inject(StudyGroupsService);
    private readonly router = inject(Router);
    private readonly snackBar = inject(MatSnackBar);

    readonly saving = signal(false);
    readonly submitError = signal('');

    readonly form = this.fb.nonNullable.group({
        course: ['', [Validators.required, Validators.maxLength(120)]],
        topic: ['', [Validators.required, Validators.maxLength(180)]],
        availability: ['', [Validators.maxLength(180)]],
        skillLevel: ['', [Validators.maxLength(120)]],
    });

    submit(): void {
        if (this.saving()) {
            return;
        }

        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.saving.set(true);
        this.submitError.set('');

        const value = this.form.getRawValue();
        this.service.createRequest({
            course: value.course.trim(),
            topic: value.topic.trim(),
            availability: value.availability.trim(),
            skillLevel: value.skillLevel.trim(),
        }).subscribe({
            next: () => {
                this.saving.set(false);
                this.snackBar.open('Study request posted.', 'Close', { duration: 2400 });
                this.router.navigate(['/study/requests']);
            },
            error: (error: HttpErrorResponse) => {
                this.saving.set(false);
                if (this.redirectIfUnauthorized(error)) {
                    return;
                }
                this.submitError.set(this.service.toErrorMessage(error));
            },
        });
    }

    hasError(controlName: 'course' | 'topic', errorName: string): boolean {
        const control = this.form.controls[controlName];
        return control.touched && control.hasError(errorName);
    }

    private redirectIfUnauthorized(error: HttpErrorResponse): boolean {
        if (error.status === 401) {
            this.router.navigate(['/auth/login']);
            return true;
        }
        return false;
    }
}
