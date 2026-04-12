import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { StudyGroupViewModel } from './study-groups.types';
import { StudyGroupsService } from './study-groups.service';

@Component({
    selector: 'app-study-groups-list',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterLink,
        MatIconModule,
        MatButtonModule,
        MatProgressSpinnerModule,
    ],
    templateUrl: './study-groups-list.html',
    styleUrl: './study-groups-list.css',
})
export class StudyGroupsList implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly service = inject(StudyGroupsService);
    private readonly router = inject(Router);

    allGroups = signal<StudyGroupViewModel[]>([]);
    loading = signal(true);
    errorMessage = signal('');
    showingCreateForm = signal(false);
    creatingGroup = signal(false);
    createErrorMessage = signal('');

    readonly filterForm = this.fb.nonNullable.group({
        search: '',
        course: '',
        topic: '',
        dayTime: '',
    });

    readonly createGroupForm = this.fb.nonNullable.group({
        course: ['', [Validators.required, Validators.maxLength(120)]],
        topic: ['', [Validators.required, Validators.maxLength(180)]],
        maxMembers: [5, [Validators.required, Validators.min(2), Validators.max(40)]],
    });

    readonly filteredGroups = computed(() =>
        this.service.applyFilters(this.allGroups(), this.filterForm.getRawValue()),
    );

    ngOnInit(): void {
        this.loadGroups();
        this.filterForm.valueChanges.subscribe(() => {
            this.allGroups.update((groups) => [...groups]);
        });
    }

    loadGroups(): void {
        this.loading.set(true);
        this.errorMessage.set('');

        this.service
            .list()
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: (groups) => this.allGroups.set(groups),
                error: (error) => this.errorMessage.set(this.service.toErrorMessage(error)),
            });
    }

    clearFilters(): void {
        this.filterForm.reset({
            search: '',
            course: '',
            topic: '',
            dayTime: '',
        });
    }

    showCreateGroupForm(): void {
        this.showingCreateForm.set(true);
        this.createErrorMessage.set('');
    }

    hideCreateGroupForm(): void {
        this.showingCreateForm.set(false);
        this.createErrorMessage.set('');
        this.createGroupForm.reset({
            course: '',
            topic: '',
            maxMembers: 5,
        });
    }

    createGroup(): void {
        if (this.creatingGroup()) {
            return;
        }

        if (this.createGroupForm.invalid) {
            this.createGroupForm.markAllAsTouched();
            return;
        }

        const value = this.createGroupForm.getRawValue();
        this.creatingGroup.set(true);
        this.createErrorMessage.set('');

        this.service.createGroup({
            course: value.course.trim(),
            topic: value.topic.trim(),
            maxMembers: value.maxMembers,
        }).subscribe({
            next: (group) => {
                this.creatingGroup.set(false);
                this.allGroups.update((existing) => [group, ...existing]);
                this.hideCreateGroupForm();
            },
            error: (error: HttpErrorResponse) => {
                this.creatingGroup.set(false);
                if (this.redirectIfUnauthorized(error)) {
                    return;
                }
                this.createErrorMessage.set(this.service.toErrorMessage(error));
            },
        });
    }

    hasCreateError(control: 'course' | 'topic', errorName: string): boolean {
        const formControl = this.createGroupForm.controls[control];
        return formControl.touched && formControl.hasError(errorName);
    }

    private redirectIfUnauthorized(error: HttpErrorResponse): boolean {
        if (error.status === 401) {
            this.router.navigate(['/auth/login']);
            return true;
        }
        return false;
    }
}
