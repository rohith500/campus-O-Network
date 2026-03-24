import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { map, Observable, of } from 'rxjs';
import {
    StudyGroupJoinLeaveResponse,
    StudyGroupMemberApiItem,
    StudyGroupsListResponse,
    StudyGroupViewModel,
} from './study-groups.types';
import { AuthService } from '../core/auth.service';

@Injectable({ providedIn: 'root' })
export class StudyGroupsService {
    private readonly groupsUrl = '/study/groups';
    private readonly joinedGroupIds = new Set<number>();
    private readonly memberCounts = new Map<number, number>();

    constructor(
        private readonly http: HttpClient,
        private readonly auth: AuthService,
    ) { }

    list(): Observable<StudyGroupViewModel[]> {
        return this.http
            .get<StudyGroupsListResponse>(this.groupsUrl)
            .pipe(map((response) => response.groups.map((group) => this.mapGroup(group))));
    }

    details(groupId: number): Observable<StudyGroupViewModel> {
        return this.http
            .get<StudyGroupsListResponse>(this.groupsUrl)
            .pipe(
                map((response) => {
                    const group = response.groups.find((item) => item.id === groupId);
                    if (!group) {
                        throw new Error('Study group not found.');
                    }
                    return this.mapGroup(group);
                }),
            );
    }

    join(groupId: number): Observable<StudyGroupMemberApiItem[]> {
        return this.http
            .post<StudyGroupJoinLeaveResponse>(`${this.groupsUrl}/${groupId}/join`, {}, { headers: this.authHeader() })
            .pipe(
                map((response) => {
                    this.joinedGroupIds.add(groupId);
                    this.memberCounts.set(groupId, response.members.length);
                    return response.members;
                }),
            );
    }

    leave(groupId: number): Observable<StudyGroupMemberApiItem[]> {
        // The backend currently has no leave endpoint for study groups.
        // Keep UI responsive by updating local state and returning the projected member count.
        const nextCount = Math.max(0, (this.memberCounts.get(groupId) ?? 0) - 1);
        this.memberCounts.set(groupId, nextCount);
        this.joinedGroupIds.delete(groupId);
        return of(Array.from({ length: nextCount }, (_, index) => ({
            id: index + 1,
            study_group_id: groupId,
            user_id: 0,
            joined_at: '',
        })));
    }

    toErrorMessage(error: unknown): string {
        if (error instanceof Error && error.message) {
            return error.message;
        }
        const httpError = error as HttpErrorResponse;
        if (!httpError.status) {
            return 'Request failed. Please check your connection and retry.';
        }
        if (httpError.status === 401) {
            return 'You need to sign in to perform this action.';
        }
        if (httpError.status === 403) {
            return 'This study group is restricted and cannot be joined.';
        }
        if (httpError.status === 404) {
            return 'Study group not found.';
        }
        if (httpError.status === 409) {
            return 'This study group is full.';
        }
        if (httpError.status === 410) {
            return 'This study group is archived.';
        }
        return 'Something went wrong. Please try again.';
    }

    applyFilters(
        groups: StudyGroupViewModel[],
        filters: { search: string; course: string; topic: string; dayTime: string },
    ): StudyGroupViewModel[] {
        const searchTerm = filters.search.trim().toLowerCase();
        const courseTerm = filters.course.trim().toLowerCase();
        const topicTerm = filters.topic.trim().toLowerCase();
        const dayTimeTerm = filters.dayTime.trim().toLowerCase();

        return groups.filter((group) => {
            const searchMatches =
                !searchTerm ||
                group.course.toLowerCase().includes(searchTerm) ||
                group.topic.toLowerCase().includes(searchTerm);
            const courseMatches = !courseTerm || group.course.toLowerCase().includes(courseTerm);
            const topicMatches = !topicTerm || group.topic.toLowerCase().includes(topicTerm);

            // The backend does not expose day/time fields yet, so this is best-effort free-text matching.
            const dayTimeMatches = !dayTimeTerm || group.topic.toLowerCase().includes(dayTimeTerm);

            return searchMatches && courseMatches && topicMatches && dayTimeMatches;
        });
    }

    private mapGroup(group: StudyGroupsListResponse['groups'][number]): StudyGroupViewModel {
        const archived = new Date(group.expires_at).getTime() <= Date.now();
        const memberCount = this.memberCounts.get(group.id) ?? 0;
        return {
            id: group.id,
            course: group.course,
            topic: group.topic,
            maxMembers: group.max_members,
            createdAt: group.created_at,
            expiresAt: group.expires_at,
            archived,
            memberCount,
            isFull: memberCount >= group.max_members,
            isJoined: this.joinedGroupIds.has(group.id),
        };
    }

    private authHeader(): HttpHeaders {
        const token = this.auth.getToken();
        if (!token) {
            return new HttpHeaders();
        }
        return new HttpHeaders({ Authorization: `Bearer ${token}` });
    }

}
