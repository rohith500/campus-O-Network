import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { API_BASE_URL } from './api.config';
import { ApiResult, PaginatedResult, PaginationParams } from './api.types';
import { applyClientPagination, mapToApiResult } from './api.utils';

export interface StudyGroup {
  id: number;
  course: string;
  topic: string;
  maxMembers: number;
  createdAt?: string;
  expiresAt?: string;
}

export interface StudyRequest {
  id: number;
  userId: number;
  course: string;
  topic: string;
  availability?: string;
  skillLevel?: string;
  matched?: boolean;
  createdAt?: string;
  expiresAt?: string;
}

export interface StudyGroupCreateInput {
  course: string;
  topic: string;
  maxMembers: number;
}

export interface StudyRequestCreateInput {
  course: string;
  topic: string;
  availability?: string;
  skillLevel?: string;
}

export interface StudyGroupListQuery extends PaginationParams {
  search?: string;
  course?: string;
}

interface GroupsResponse {
  ok: boolean;
  groups: ApiStudyGroup[];
}

interface GroupResponse {
  ok: boolean;
  group: ApiStudyGroup;
}

interface RequestsResponse {
  ok: boolean;
  requests: ApiStudyRequest[];
}

interface RequestResponse {
  ok: boolean;
  request: ApiStudyRequest;
}

interface ApiStudyGroup {
  id?: number;
  ID?: number;
  course?: string;
  Course?: string;
  topic?: string;
  Topic?: string;
  max_members?: number;
  MaxMembers?: number;
  created_at?: string;
  CreatedAt?: string;
  expires_at?: string;
  ExpiresAt?: string;
}

interface ApiStudyRequest {
  id?: number;
  ID?: number;
  user_id?: number;
  UserID?: number;
  course?: string;
  Course?: string;
  topic?: string;
  Topic?: string;
  availability?: string;
  Availability?: string;
  skill_level?: string;
  SkillLevel?: string;
  matched?: boolean;
  Matched?: boolean;
  created_at?: string;
  CreatedAt?: string;
  expires_at?: string;
  ExpiresAt?: string;
}

@Injectable({ providedIn: 'root' })
export class StudyGroupsApiService {
  private readonly groupsUrl = `${API_BASE_URL}/study/groups`;
  private readonly requestsUrl = `${API_BASE_URL}/study/requests`;

  constructor(private http: HttpClient) {}

  list(query?: StudyGroupListQuery): Observable<ApiResult<PaginatedResult<StudyGroup>>> {
    const source$ = this.http.get<GroupsResponse>(this.groupsUrl).pipe(
      map((res) => (res.groups ?? []).map((group) => this.normalizeGroup(group))),
      map((groups) => this.applyFilters(groups, query)),
      map((groups) => applyClientPagination(groups, query)),
    );

    return mapToApiResult(source$);
  }

  getById(id: number): Observable<ApiResult<StudyGroup>> {
    const source$ = this.http.get<GroupsResponse>(this.groupsUrl).pipe(
      map((res) => (res.groups ?? []).map((group) => this.normalizeGroup(group))),
      map((groups) => groups.find((group) => group.id === id)),
      map((group) => {
        if (!group) throw new Error('Study group not found');
        return group;
      }),
    );

    return mapToApiResult(source$);
  }

  create(input: StudyGroupCreateInput): Observable<ApiResult<StudyGroup>> {
    const source$ = this.http
      .post<GroupResponse>(this.groupsUrl, input)
      .pipe(map((res) => this.normalizeGroup(res.group)));

    return mapToApiResult(source$);
  }

  update(id: number, input: Partial<StudyGroupCreateInput>): Observable<ApiResult<StudyGroup>> {
    const source$ = this.http
      .put<GroupResponse>(`${this.groupsUrl}/${id}`, input)
      .pipe(map((res) => this.normalizeGroup(res.group)));

    return mapToApiResult(source$);
  }

  delete(id: number): Observable<ApiResult<{ deleted: boolean }>> {
    const source$ = this.http
      .delete<{ ok?: boolean }>(`${this.groupsUrl}/${id}`)
      .pipe(map(() => ({ deleted: true })));

    return mapToApiResult(source$);
  }

  join(groupId: number): Observable<ApiResult<{ joined: boolean }>> {
    const source$ = this.http
      .post<{ ok?: boolean }>(`${this.groupsUrl}/${groupId}/join`, {})
      .pipe(map(() => ({ joined: true })));

    return mapToApiResult(source$);
  }

  listRequests(): Observable<ApiResult<StudyRequest[]>> {
    const source$ = this.http
      .get<RequestsResponse>(this.requestsUrl)
      .pipe(map((res) => (res.requests ?? []).map((request) => this.normalizeRequest(request))));

    return mapToApiResult(source$);
  }

  createRequest(input: StudyRequestCreateInput): Observable<ApiResult<StudyRequest>> {
    const source$ = this.http
      .post<RequestResponse>(this.requestsUrl, input)
      .pipe(map((res) => this.normalizeRequest(res.request)));

    return mapToApiResult(source$);
  }

  private normalizeGroup(group: ApiStudyGroup): StudyGroup {
    return {
      id: group.id ?? group.ID ?? 0,
      course: group.course ?? group.Course ?? '',
      topic: group.topic ?? group.Topic ?? '',
      maxMembers: group.max_members ?? group.MaxMembers ?? 0,
      createdAt: group.created_at ?? group.CreatedAt,
      expiresAt: group.expires_at ?? group.ExpiresAt,
    };
  }

  private normalizeRequest(request: ApiStudyRequest): StudyRequest {
    return {
      id: request.id ?? request.ID ?? 0,
      userId: request.user_id ?? request.UserID ?? 0,
      course: request.course ?? request.Course ?? '',
      topic: request.topic ?? request.Topic ?? '',
      availability: request.availability ?? request.Availability,
      skillLevel: request.skill_level ?? request.SkillLevel,
      matched: request.matched ?? request.Matched,
      createdAt: request.created_at ?? request.CreatedAt,
      expiresAt: request.expires_at ?? request.ExpiresAt,
    };
  }

  private applyFilters(groups: StudyGroup[], query?: StudyGroupListQuery): StudyGroup[] {
    if (!query) return groups;

    const search = query.search?.toLowerCase().trim();
    const course = query.course?.toLowerCase().trim();

    return groups.filter((group) => {
      const text = `${group.course} ${group.topic}`.toLowerCase();
      const searchOk = !search || text.includes(search);
      const courseOk = !course || group.course.toLowerCase().includes(course);
      return searchOk && courseOk;
    });
  }
}
