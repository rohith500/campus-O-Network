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
    isFull: boolean;
    isJoined: boolean;
}
