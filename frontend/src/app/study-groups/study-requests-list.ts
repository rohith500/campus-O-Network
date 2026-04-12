import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { StudyGroupsService } from './study-groups.service';
import { StudyRequestViewModel } from './study-groups.types';

@Component({
    selector: 'app-study-requests-list',
    imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
    templateUrl: './study-requests-list.html',
    styleUrl: './study-requests-list.css',
})
export class StudyRequestsList implements OnInit {
    private readonly service = inject(StudyGroupsService);
    private readonly router = inject(Router);

    requests = signal<StudyRequestViewModel[]>([]);
    loading = signal(true);
    errorMessage = signal('');

    ngOnInit(): void {
        this.loadRequests();
    }

    loadRequests(): void {
        this.loading.set(true);
        this.errorMessage.set('');

        this.service.listRequests().subscribe({
            next: (requests) => {
                this.requests.set(requests);
                this.loading.set(false);
            },
            error: (error: HttpErrorResponse) => {
                this.loading.set(false);
                this.errorMessage.set(this.service.toErrorMessage(error));
            },
        });
    }

    openNewRequest(): void {
        this.router.navigate(['/study/requests/new']);
    }
}
