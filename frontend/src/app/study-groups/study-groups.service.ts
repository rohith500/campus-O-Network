import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { map, Observable, of, tap } from 'rxjs';
import {
    CreateStudyGroupPayload,
    CreateStudyRequestPayload,
    StudyGroupCreateResponse,
    StudyGroupJoinLeaveResponse,
    StudyGroupMemberApiItem,
    StudyGroupApiItem,
    StudyGroupsListResponse,
    StudyRequestCreateResponse,
    StudyRequestViewModel,
    StudyRequestsListResponse,
    StudyGroupViewModel,
} from './study-groups.types';
import { AuthService } from '../core/auth.service';
import { API_BASE_URL } from '../core/api/api.config';

@Injectable({ providedIn: 'root' })
export class StudyGroupsService {
    private readonly apiBase = API_BASE_URL;
    private readonly groupsUrl = `${this.apiBase}/study/groups`;
    private readonly requestsUrl = `${this.apiBase}/study/requests`;
    private readonly joinedGroupIds = new Set<number>();
    private readonly participantIdsByGroup = new Map<number, number[]>();
    private cachedGroups: StudyGroupViewModel[] | null = null;
    private cachedRequests: StudyRequestViewModel[] | null = null;

    constructor(
        private readonly http: HttpClient,
        private readonly auth: AuthService,
    ) { }

    list(): Observable<StudyGroupViewModel[]> {
        if (this.cachedGroups) {
            return of(this.cachedGroups.map((group) => ({ ...group })));
        }

        return this.http
            .get<StudyGroupsListResponse>(this.groupsUrl)
            .pipe(
                map((response) => {
                    const groups = response.groups ?? [];
                    const mapped = groups.map((group) => this.mapGroup(group));
                    this.cachedGroups = mapped;
                    return mapped.map((group) => ({ ...group }));
                }),
            );
    }

    listRequests(forceRefresh = false): Observable<StudyRequestViewModel[]> {
        if (!forceRefresh && this.cachedRequests) {
            return of(this.cachedRequests.map((request) => ({ ...request })));
        }

        return this.http
            .get<StudyRequestsListResponse>(this.requestsUrl)
            .pipe(
                map((response) => {
                    const requests = (response.requests ?? []).map((request) => this.mapRequest(request));
                    this.cachedRequests = requests;
                    return requests.map((request) => ({ ...request }));
                }),
            );
    }

    createRequest(payload: CreateStudyRequestPayload): Observable<StudyRequestViewModel> {
        return this.http
            .post<StudyRequestCreateResponse>(this.requestsUrl, payload, { headers: this.authHeader() })
            .pipe(
                map((response) => this.mapRequest(response.request)),
                tap((request) => {
                    const current = this.cachedRequests ?? [];
                    this.cachedRequests = [request, ...current];
                }),
            );
    }

    createGroup(payload: CreateStudyGroupPayload): Observable<StudyGroupViewModel> {
        return this.http
            .post<StudyGroupCreateResponse>(this.groupsUrl, payload, { headers: this.authHeader() })
            .pipe(
                map((response) => this.mapGroup(response.group)),
                tap((group) => {
                    const current = this.cachedGroups ?? [];
                    this.cachedGroups = [group, ...current];
                }),
            );
    }

    invalidateGroupsCache(): void {
        this.cachedGroups = null;
    }

    invalidateRequestsCache(): void {
        this.cachedRequests = null;
    }

    details(groupId: number): Observable<StudyGroupViewModel> {
        return this.http
            .get<{ ok: boolean; group: StudyGroupApiItem; members: StudyGroupMemberApiItem[] }>(
                `${this.groupsUrl}/${groupId}`
            )
            .pipe(
                map((response) => {
                    if (!response.group) {
                        throw new Error('Study group not found.');
                    }
                    return this.mapGroup(response.group);
                }),
            );
    }

    join(groupId: number): Observable<StudyGroupMemberApiItem[]> {
        return this.http
            .post<StudyGroupJoinLeaveResponse>(`${this.groupsUrl}/${groupId}/join`, {}, { headers: this.authHeader() })
            .pipe(
                map((response) => {
                    const participantIds = Array.from(new Set((response.members ?? []).map((member) => (
                        Number((member as { user_id?: number; userId?: number; UserID?: number }).user_id
                            ?? (member as { user_id?: number; userId?: number; UserID?: number }).userId
                            ?? (member as { user_id?: number; userId?: number; UserID?: number }).UserID
                            ?? 0)
                    ))));
                    this.participantIdsByGroup.set(groupId, participantIds);

                    const currentUserId = this.getCurrentUserId();
                    if (currentUserId === null || participantIds.includes(currentUserId)) {
                        this.joinedGroupIds.add(groupId);
                    }
                    this.cachedGroups = this.cachedGroups?.map((group) =>
                        group.id === groupId
                            ? {
                                ...group,
                                participantUserIds: participantIds,
                                hasParticipantData: true,
                                memberCount: participantIds.length,
                                isJoined: true,
                                isFull: participantIds.length >= group.maxMembers,
                            }
                            : group,
                    ) ?? null;
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
        this.cachedGroups = this.cachedGroups?.map((group) =>
            group.id === groupId
                ? {
                    ...group,
                    participantUserIds: nextParticipantIds,
                    hasParticipantData: true,
                    memberCount: nextParticipantIds.length,
                    isJoined: false,
                    isFull: nextParticipantIds.length >= group.maxMembers,
                }
                : group,
        ) ?? null;
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

    private mapGroup(group: StudyGroupApiItem): StudyGroupViewModel {
        const normalized = group as StudyGroupApiItem & {
            id?: number;
            ID?: number;
            course?: string;
            Course?: string;
            topic?: string;
            Topic?: string;
            max_members?: number;
            maxMembers?: number;
            MaxMembers?: number;
            created_at?: string;
            createdAt?: string;
            CreatedAt?: string;
            expires_at?: string;
            expiresAt?: string;
            ExpiresAt?: string;
        };

        const id = Number(normalized.id ?? normalized.ID ?? 0);
        const course = normalized.course ?? normalized.Course ?? '';
        const topic = normalized.topic ?? normalized.Topic ?? '';
        const maxMembers = Number(normalized.max_members ?? normalized.maxMembers ?? normalized.MaxMembers ?? 0);
        const createdAt = normalized.created_at ?? normalized.createdAt ?? normalized.CreatedAt ?? '';
        const expiresAt = normalized.expires_at ?? normalized.expiresAt ?? normalized.ExpiresAt ?? '';

        const archived = new Date(expiresAt).getTime() <= Date.now();
        const participantUserIds = this.participantIdsByGroup.get(id) ?? [];
        const hasParticipantData = this.participantIdsByGroup.has(id);
        const memberCount = participantUserIds.length;
        return {
            id,
            course,
            topic,
            maxMembers,
            createdAt,
            expiresAt,
            archived,
            memberCount,
            participantUserIds,
            hasParticipantData,
            scheduleText: 'Schedule details are not provided by the backend yet.',
            isFull: memberCount >= maxMembers,
            isJoined: this.joinedGroupIds.has(id),
        };
    }

    private mapRequest(request: StudyRequestsListResponse['requests'][number]): StudyRequestViewModel {
        const normalized = request as StudyRequestsListResponse['requests'][number] & {
            id?: number;
            ID?: number;
            user_id?: number;
            userId?: number;
            UserID?: number;
            course?: string;
            Course?: string;
            topic?: string;
            Topic?: string;
            availability?: string;
            Availability?: string;
            skill_level?: string;
            skillLevel?: string;
            SkillLevel?: string;
            matched?: boolean;
            Matched?: boolean;
            created_at?: string;
            createdAt?: string;
            CreatedAt?: string;
            expires_at?: string;
            expiresAt?: string;
            ExpiresAt?: string;
        };

        return {
            id: Number(normalized.id ?? normalized.ID ?? 0),
            userId: Number(normalized.user_id ?? normalized.userId ?? normalized.UserID ?? 0),
            course: normalized.course ?? normalized.Course ?? '',
            topic: normalized.topic ?? normalized.Topic ?? '',
            availability: normalized.availability ?? normalized.Availability ?? '',
            skillLevel: normalized.skill_level ?? normalized.skillLevel ?? normalized.SkillLevel ?? '',
            matched: Boolean(normalized.matched ?? normalized.Matched ?? false),
            createdAt: normalized.created_at ?? normalized.createdAt ?? normalized.CreatedAt ?? '',
            expiresAt: normalized.expires_at ?? normalized.expiresAt ?? normalized.ExpiresAt ?? '',
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
