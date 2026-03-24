import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { StudyGroupsService } from './study-groups.service';
import { StudyGroupViewModel } from './study-groups.types';

@Component({
    selector: 'app-study-group-detail',
    imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
    templateUrl: './study-group-detail.html',
    styleUrl: './study-group-detail.css',
})
export class StudyGroupDetail implements OnInit {
    group = signal<StudyGroupViewModel | null>(null);
    loading = signal(true);
    actionBusy = signal(false);
    errorMessage = signal('');
    actionMessage = signal('');

    private groupId = 0;

    constructor(
        private readonly route: ActivatedRoute,
        private readonly service: StudyGroupsService,
    ) { }

    ngOnInit(): void {
        const routeId = this.route.snapshot.paramMap.get('id');
        this.groupId = routeId ? Number.parseInt(routeId, 10) : 0;
        if (!this.groupId) {
            this.loading.set(false);
            this.errorMessage.set('Invalid study group id.');
            return;
        }

        this.loadDetails();
    }

    canJoin(group: StudyGroupViewModel): boolean {
        return !group.isJoined && !group.archived && !group.isFull;
    }

    canLeave(group: StudyGroupViewModel): boolean {
        return group.isJoined && !group.archived;
    }

    join(): void {
        const current = this.group();
        if (!current || !this.canJoin(current)) {
            return;
        }

        this.actionMessage.set('');
        this.actionBusy.set(true);

        const optimistic: StudyGroupViewModel = {
            ...current,
            isJoined: true,
            memberCount: current.memberCount + 1,
            isFull: current.memberCount + 1 >= current.maxMembers,
        };

        this.group.set(optimistic);

        this.service
            .join(this.groupId)
            .pipe(finalize(() => this.actionBusy.set(false)))
            .subscribe({
                next: (members) => {
                    this.group.update((group) => {
                        if (!group) {
                            return group;
                        }
                        return {
                            ...group,
                            isJoined: true,
                            memberCount: members.length,
                            isFull: members.length >= group.maxMembers,
                        };
                    });
                    this.actionMessage.set('Joined successfully.');
                },
                error: (error) => {
                    this.group.set(current);
                    this.actionMessage.set(this.service.toErrorMessage(error));
                },
            });
    }

    leave(): void {
        const current = this.group();
        if (!current || !this.canLeave(current)) {
            return;
        }

        this.actionMessage.set('');
        this.actionBusy.set(true);

        const optimistic: StudyGroupViewModel = {
            ...current,
            isJoined: false,
            memberCount: Math.max(0, current.memberCount - 1),
            isFull: false,
        };

        this.group.set(optimistic);

        this.service
            .leave(this.groupId)
            .pipe(finalize(() => this.actionBusy.set(false)))
            .subscribe({
                next: (members) => {
                    this.group.update((group) => {
                        if (!group) {
                            return group;
                        }
                        return {
                            ...group,
                            isJoined: false,
                            memberCount: members.length,
                            isFull: members.length >= group.maxMembers,
                        };
                    });
                    this.actionMessage.set('Leave updated in UI. Backend leave route is not available yet.');
                },
                error: (error) => {
                    this.group.set(current);
                    this.actionMessage.set(this.service.toErrorMessage(error));
                },
            });
    }

    private loadDetails(): void {
        this.loading.set(true);
        this.errorMessage.set('');

        this.service
            .details(this.groupId)
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: (group) => this.group.set(group),
                error: (error) => this.errorMessage.set(this.service.toErrorMessage(error)),
            });
    }
}
