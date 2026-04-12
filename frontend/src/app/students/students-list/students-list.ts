import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Student, StudentsService } from '../../core/students.service';

@Component({
    selector: 'app-students-list',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatProgressSpinnerModule,
    ],
    templateUrl: './students-list.html',
    styleUrl: './students-list.css',
})
export class StudentsList implements OnInit {
    private readonly fb = inject(FormBuilder);

    loading = signal(true);
    error = signal('');
    students = signal<Student[]>([]);

    readonly filtersForm = this.fb.nonNullable.group({
        query: '',
    });

    readonly filteredStudents = computed(() => {
        const query = this.filtersForm.controls.query.value.trim().toLowerCase();
        if (!query) {
            return this.students();
        }

        return this.students().filter((student) => {
            const haystack = `${student.name} ${student.email} ${student.major} ${student.year}`.toLowerCase();
            return haystack.includes(query);
        });
    });

    constructor(
        private readonly studentsService: StudentsService,
        private readonly router: Router,
    ) { }

    ngOnInit(): void {
        this.loadStudents();
    }

    loadStudents(): void {
        this.loading.set(true);
        this.error.set('');

        this.studentsService.listStudents().subscribe({
            next: (students) => {
                this.students.set(students);
                this.loading.set(false);
            },
            error: (error: HttpErrorResponse) => {
                this.loading.set(false);
                if (this.redirectIfUnauthorized(error)) {
                    return;
                }
                this.error.set(this.toMessage(error, 'Failed to load students.'));
            },
        });
    }

    openStudent(studentId: number): void {
        this.router.navigate(['/students', studentId]);
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
