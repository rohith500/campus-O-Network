import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Student, StudentsService } from '../../core/students.service';

@Component({
    selector: 'app-student-detail',
    imports: [
        CommonModule,
        RouterModule,
        MatButtonModule,
        MatIconModule,
        MatSnackBarModule,
    ],
    templateUrl: './student-detail.html',
    styleUrl: './student-detail.css',
})
export class StudentDetail implements OnInit {
    loading = signal(true);
    deleting = signal(false);
    error = signal('');
    student = signal<Student | null>(null);

    private studentId: number | null = null;

    constructor(
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly studentsService: StudentsService,
        private readonly snackBar: MatSnackBar,
    ) { }

    ngOnInit(): void {
        const idParam = this.route.snapshot.paramMap.get('id');
        const parsedId = Number(idParam);

        if (!idParam || !Number.isFinite(parsedId) || parsedId <= 0) {
            this.error.set('Invalid student id.');
            this.loading.set(false);
            return;
        }

        this.studentId = parsedId;
        this.loadStudent();
    }

    loadStudent(): void {
        if (!this.studentId) return;

        this.loading.set(true);
        this.error.set('');

        this.studentsService.getStudent(this.studentId).subscribe({
            next: (student) => {
                this.student.set(student);
                this.loading.set(false);
            },
            error: (error: HttpErrorResponse) => {
                this.loading.set(false);
                if (this.redirectIfUnauthorized(error)) {
                    return;
                }
                this.error.set(this.toMessage(error, 'Failed to load student details.'));
            },
        });
    }

    onDelete(): void {
        if (!this.studentId || this.deleting()) {
            return;
        }

        const confirmed = window.confirm('Delete this student record? This action cannot be undone.');
        if (!confirmed) {
            return;
        }

        this.deleting.set(true);
        this.error.set('');

        this.studentsService.deleteStudent(this.studentId).subscribe({
            next: () => {
                this.deleting.set(false);
                this.snackBar.open('Student deleted successfully.', 'Close', { duration: 2500 });
                this.router.navigate(['/students']);
            },
            error: (error: HttpErrorResponse) => {
                this.deleting.set(false);
                if (this.redirectIfUnauthorized(error)) {
                    return;
                }
                this.error.set(this.toMessage(error, 'Failed to delete student.'));
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
