export interface StudyGroupApiItem {
    id: number;
    course: string;
    topic: string;
    max_members: number;
    created_at: string;
    expires_at: string;
}

export interface StudyGroupMemberApiItem {
    id: number;
    study_group_id: number;
    user_id: number;
    joined_at: string;
}

export interface StudyGroupsListResponse {
    ok: boolean;
    groups: StudyGroupApiItem[];
}

export interface StudyRequestApiItem {
    id: number;
    user_id: number;
    course: string;
    topic: string;
    availability: string;
    skill_level: string;
    matched: boolean;
    created_at: string;
    expires_at: string;
}

export interface StudyRequestsListResponse {
    ok: boolean;
    requests: StudyRequestApiItem[];
}

export interface StudyRequestCreateResponse {
    ok: boolean;
    request: StudyRequestApiItem;
}

export interface StudyGroupCreateResponse {
    ok: boolean;
    group: StudyGroupApiItem;
}

export interface StudyGroupDetailResponse {
    ok: boolean;
    group: StudyGroupApiItem;
    members: StudyGroupMemberApiItem[];
    archived: boolean;
}

export interface StudyGroupJoinLeaveResponse {
    ok: boolean;
    message: string;
    members: StudyGroupMemberApiItem[];
}

export interface StudyGroupViewModel {
    id: number;
    course: string;
    topic: string;
    maxMembers: number;
    createdAt: string;
    expiresAt: string;
    archived: boolean;
    memberCount: number;
    participantUserIds: number[];
    hasParticipantData: boolean;
    scheduleText: string;
    isFull: boolean;
    isJoined: boolean;
}

export interface StudyRequestViewModel {
    id: number;
    userId: number;
    course: string;
    topic: string;
    availability: string;
    skillLevel: string;
    matched: boolean;
    createdAt: string;
    expiresAt: string;
}

export interface CreateStudyRequestPayload {
    course: string;
    topic: string;
    availability: string;
    skillLevel: string;
}

export interface CreateStudyGroupPayload {
    course: string;
    topic: string;
    maxMembers: number;
}
