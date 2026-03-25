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
    private readonly apiBase = 'http://localhost:8079';
    private readonly groupsUrl = `${this.apiBase}/study/groups`;
    private readonly joinedGroupIds = new Set<number>();
    private readonly participantIdsByGroup = new Map<number, number[]>();

    constructor(
        private readonly http: HttpClient,
        private readonly auth: AuthService,
    ) { }

    list(): Observable<StudyGroupViewModel[]> {
        return this.http
            .get<StudyGroupsListResponse>(this.groupsUrl)
            .pipe(
                map((response) => {
                    const groups = response.groups ?? [];
                    return groups.map((group) => this.mapGroup(group));
                }),
            );
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
                    const participantIds = Array.from(new Set((response.members ?? []).map((member) => member.user_id)));
                    this.participantIdsByGroup.set(groupId, participantIds);

                    const currentUserId = this.getCurrentUserId();
                    if (currentUserId === null || participantIds.includes(currentUserId)) {
                        this.joinedGroupIds.add(groupId);
                    }
                    return response.members;
                }),
            );
    }

    leave(groupId: number): Observable<StudyGroupMemberApiItem[]> {
        // The backend currently has no leave endpoint for study groups.
        // Keep UI responsive by updating local state and returning the projected member count.
        const participantIds = [...(this.participantIdsByGroup.get(groupId) ?? [])];
        const currentUserId = this.getCurrentUserId();
        let nextParticipantIds = participantIds;

        if (currentUserId !== null && participantIds.includes(currentUserId)) {
            nextParticipantIds = participantIds.filter((id) => id !== currentUserId);
        } else if (participantIds.length > 0) {
            nextParticipantIds = participantIds.slice(0, participantIds.length - 1);
        }

        this.participantIdsByGroup.set(groupId, nextParticipantIds);
        this.joinedGroupIds.delete(groupId);
        return of(nextParticipantIds.map((userId, index) => ({
            id: index + 1,
            study_group_id: groupId,
            user_id: userId,
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
        if (httpError.status === 500) {
            return 'Study groups are temporarily unavailable due to a server error. Please try again shortly.';
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
        const participantUserIds = this.participantIdsByGroup.get(group.id) ?? [];
        const hasParticipantData = this.participantIdsByGroup.has(group.id);
        const memberCount = participantUserIds.length;
        return {
            id: group.id,
            course: group.course,
            topic: group.topic,
            maxMembers: group.max_members,
            createdAt: group.created_at,
            expiresAt: group.expires_at,
            archived,
            memberCount,
            participantUserIds,
            hasParticipantData,
            scheduleText: 'Schedule details are not provided by the backend yet.',
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

    private getCurrentUserId(): number | null {
        const currentUser = this.auth.getCurrentUser();
        if (currentUser?.id) {
            return currentUser.id;
        }

        const token = this.auth.getToken();
        if (!token) {
            return null;
        }

        const parts = token.split('.');
        if (parts.length < 2) {
            return null;
        }

        try {
            const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))) as {
                user_id?: number | string;
                sub?: number | string;
            };
            const raw = payload.user_id ?? payload.sub;
            if (typeof raw === 'number') {
                return raw;
            }
            if (typeof raw === 'string') {
                const parsed = Number.parseInt(raw, 10);
                return Number.isNaN(parsed) ? null : parsed;
            }
            return null;
        } catch {
            return null;
        }
    }

}
