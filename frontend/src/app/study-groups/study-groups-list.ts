import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
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

    allGroups = signal<StudyGroupViewModel[]>([]);
    loading = signal(true);
    errorMessage = signal('');

    readonly filterForm = this.fb.nonNullable.group({
        search: '',
        course: '',
        topic: '',
        dayTime: '',
    });

    readonly filteredGroups = computed(() =>
        this.service.applyFilters(this.allGroups(), this.filterForm.getRawValue()),
    );

    ngOnInit(): void {
        this.loadGroups();
        this.filterForm.valueChanges.subscribe(() => {
            // Trigger recomputation for list rendering.
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
}
