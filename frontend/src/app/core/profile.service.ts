import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { API_BASE_URL } from './api/api.config';

export interface Profile {
    name: string;
    bio: string;
    interests: string;
    availability: string;
    skillLevel: string;
}

export interface UpdateProfilePayload {
    bio: string;
    interests: string;
    availability: string;
    skillLevel: string;
}

interface ProfileApiItem {
    name?: string;
    bio?: string;
    interests?: string;
    availability?: string;
    skillLevel?: string;
    skill_level?: string;
    Name?: string;
    Bio?: string;
    Interests?: string;
    Availability?: string;
    SkillLevel?: string;
}

interface ProfileApiResponse {
    ok?: boolean;
    profile?: ProfileApiItem | null;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
    private readonly profileUrl = `${API_BASE_URL}/profile`;

    constructor(private readonly http: HttpClient) { }

    getProfile(): Observable<Profile | null> {
        return this.http.get<ProfileApiResponse | ProfileApiItem | null>(this.profileUrl).pipe(
            map((response) => {
                if (response === null) {
                    return null;
                }

                const profileSource = this.extractProfileSource(response);
                if (!profileSource) {
                    return null;
                }

                return this.normalizeProfile(profileSource);
            }),
        );
    }

    updateProfile(payload: UpdateProfilePayload): Observable<Profile> {
        return this.http.put<ProfileApiResponse | ProfileApiItem>(this.profileUrl, payload).pipe(
            map((response) => {
                const profileSource = this.extractProfileSource(response) ?? payload;
                return this.normalizeProfile(profileSource);
            }),
        );
    }

    private extractProfileSource(
        response: ProfileApiResponse | ProfileApiItem,
    ): ProfileApiItem | null {
        if ('profile' in response) {
            return response.profile ?? null;
        }
        return response as ProfileApiItem;
    }

    private normalizeProfile(source: ProfileApiItem): Profile {
        return {
            name: source.name ?? source.Name ?? '',
            bio: source.bio ?? source.Bio ?? '',
            interests: source.interests ?? source.Interests ?? '',
            availability: source.availability ?? source.Availability ?? '',
            skillLevel: source.skillLevel ?? source.skill_level ?? source.SkillLevel ?? '',
        };
    }
}
