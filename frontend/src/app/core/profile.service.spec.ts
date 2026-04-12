import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ProfileService } from './profile.service';
import { authInterceptor } from './auth.interceptor';
import { API_BASE_URL } from './api/api.config';

describe('ProfileService', () => {
    let service: ProfileService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(withInterceptors([authInterceptor])),
                provideHttpClientTesting(),
            ],
        });

        service = TestBed.inject(ProfileService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('calls GET /profile and maps profile response', () => {
        let received: unknown;
        service.getProfile().subscribe((profile) => {
            received = profile;
        });

        const req = httpMock.expectOne(`${API_BASE_URL}/profile`);
        expect(req.request.method).toBe('GET');
        req.flush({
            ok: true,
            profile: {
                bio: 'CS student',
                interests: 'AI, Web',
                availability: 'Weekdays evenings',
                skill_level: 'Intermediate',
            },
        });

        expect(received).toEqual({
            name: '',
            bio: 'CS student',
            interests: 'AI, Web',
            availability: 'Weekdays evenings',
            skillLevel: 'Intermediate',
        });
    });

    it('returns null when backend profile is null', () => {
        let received: unknown = 'unset';
        service.getProfile().subscribe((profile) => {
            received = profile;
        });

        const req = httpMock.expectOne(`${API_BASE_URL}/profile`);
        req.flush({ ok: true, profile: null });

        expect(received).toBeNull();
    });

    it('calls PUT /profile and maps updated profile response', () => {
        const payload = {
            bio: 'Updated bio',
            interests: 'Go, Angular',
            availability: 'Weekends',
            skillLevel: 'Advanced',
        };

        let received: unknown;
        service.updateProfile(payload).subscribe((profile) => {
            received = profile;
        });

        const req = httpMock.expectOne(`${API_BASE_URL}/profile`);
        expect(req.request.method).toBe('PUT');
        expect(req.request.body).toEqual(payload);
        req.flush({
            ok: true,
            profile: {
                name: 'Ash',
                bio: 'Updated bio',
                interests: 'Go, Angular',
                availability: 'Weekends',
                skillLevel: 'Advanced',
            },
        });

        expect(received).toEqual({
            name: 'Ash',
            ...payload,
        });
    });
});
