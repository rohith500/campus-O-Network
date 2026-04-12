import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { StudentsService } from '../../core/students.service';

@Component({
    selector: 'app-student-form',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatSnackBarModule,
    ],
    templateUrl: './student-form.html',
    styleUrl: './student-form.css',
})
export class StudentForm implements OnInit {
    private readonly fb = inject(FormBuilder);

    loading = signal(false);
    initializing = signal(false);
    isEditMode = signal(false);
    error = signal('');
    private studentId: number | null = null;

    readonly form = this.fb.nonNullable.group({
        name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
        email: ['', [Validators.required, Validators.email, Validators.maxLength(180)]],
        major: ['', [Validators.maxLength(120)]],
        year: [1, [Validators.required, Validators.min(1), Validators.max(8)]],
    });

    readonly title = computed(() => (this.isEditMode() ? 'Edit Student' : 'Add Student'));

    constructor(
        private readonly studentsService: StudentsService,
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly snackBar: MatSnackBar,
    ) { }

    ngOnInit(): void {
        const idParam = this.route.snapshot.paramMap.get('id');
        if (!idParam) {
            return;
        }

        const parsedId = Number(idParam);
        if (!Number.isFinite(parsedId) || parsedId <= 0) {
            this.error.set('Invalid student id.');
            return;
        }

        this.studentId = parsedId;
        this.isEditMode.set(true);
        this.initializing.set(true);

        this.studentsService.getStudent(parsedId).subscribe({
            next: (student) => {
                this.initializing.set(false);
                this.form.setValue({
                    name: student.name,
                    email: student.email,
                    major: student.major,
                    year: student.year || 1,
                });
            },
            error: (error: HttpErrorResponse) => {
                this.initializing.set(false);
                if (this.redirectIfUnauthorized(error)) {
                    return;
                }
                this.error.set(this.toMessage(error, 'Failed to load student details.'));
            },
        });
    }

    onSubmit(): void {
        if (this.form.invalid || this.loading()) {
            this.form.markAllAsTouched();
            return;
        }

        this.loading.set(true);
        this.error.set('');

        const payload = this.form.getRawValue();
        if (this.isEditMode() && this.studentId) {
            this.studentsService.updateStudent(this.studentId, payload).subscribe({
                next: () => {
                    this.loading.set(false);
                    this.snackBar.open('Student saved successfully.', 'Close', { duration: 2500 });
                    this.router.navigate(['/students', this.studentId]);
                },
                error: (error: HttpErrorResponse) => {
                    this.loading.set(false);
                    if (this.redirectIfUnauthorized(error)) {
                        return;
                    }
                    this.error.set(this.toMessage(error, 'Failed to save student.'));
                },
            });
            return;
        }

        this.studentsService.createStudent(payload).subscribe({
            next: (newStudentId: number) => {
                this.loading.set(false);
                this.snackBar.open('Student saved successfully.', 'Close', { duration: 2500 });
                if (newStudentId > 0) {
                    this.router.navigate(['/students', newStudentId]);
                    return;
                }
                this.router.navigate(['/students']);
            },
            error: (error: HttpErrorResponse) => {
                this.loading.set(false);
                if (this.redirectIfUnauthorized(error)) {
                    return;
                }
                this.error.set(this.toMessage(error, 'Failed to save student.'));
            },
        });
    }

    private redirectIfUnauthorized(error: HttpErrorResponse): boolean {
        if (error.status === 401) {
            this.router.navigate(['/auth/login']);
            return true;
        }
        if (error.status === 403) {
            this.router.navigate(['/feed']);
            return true;
        }
        return false;
    }

    private toMessage(error: HttpErrorResponse, fallback: string): string {
        return typeof error.error === 'string' && error.error.trim().length > 0
            ? error.error.trim()
            : fallback;
    }
}
