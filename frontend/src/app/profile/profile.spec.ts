import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { Profile } from './profile';
import { ProfileService } from '../core/profile.service';
import { AuthService } from '../core/auth.service';

describe('Profile component', () => {
    let getProfileMock: ReturnType<typeof vi.fn>;
    let updateProfileMock: ReturnType<typeof vi.fn>;
    let getCurrentUserMock: ReturnType<typeof vi.fn>;
    let updateCurrentUserNameMock: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
        getProfileMock = vi.fn();
        updateProfileMock = vi.fn();
        getCurrentUserMock = vi.fn().mockReturnValue({
            id: 1,
            email: 'student@uf.edu',
            name: 'Ashmit',
            role: 'student',
        });
        updateCurrentUserNameMock = vi.fn();

        await TestBed.configureTestingModule({
            imports: [Profile],
            providers: [
                {
                    provide: ProfileService,
                    useValue: {
                        getProfile: getProfileMock,
                        updateProfile: updateProfileMock,
                    },
                },
                {
                    provide: AuthService,
                    useValue: {
                        getCurrentUser: getCurrentUserMock,
                        updateCurrentUserName: updateCurrentUserNameMock,
                    },
                },
            ],
        }).compileComponents();
    });

    it('loads profile on init and populates form', () => {
        getProfileMock.mockReturnValue(
            of({
                bio: 'Hello campus',
                interests: 'Design, Robotics',
                availability: 'Weeknights',
                skillLevel: 'Intermediate',
            }),
        );

        const fixture = TestBed.createComponent(Profile);
        fixture.detectChanges();

        const component = fixture.componentInstance;
        expect(component.loading()).toBe(false);
        expect(component.isEditing()).toBe(false);
        expect(component.hasSavedProfile()).toBe(true);
        expect(component.form.getRawValue()).toEqual({
            name: 'Ashmit',
            bio: 'Hello campus',
            interests: 'Design, Robotics',
            availability: 'Weeknights',
            skillLevel: 'Intermediate',
        });
    });

    it('shows empty-state form when backend returns null profile', () => {
        getProfileMock.mockReturnValue(of(null));

        const fixture = TestBed.createComponent(Profile);
        fixture.detectChanges();

        const component = fixture.componentInstance;
        expect(component.loading()).toBe(false);
        expect(component.isEditing()).toBe(true);
        expect(component.hasSavedProfile()).toBe(false);
        expect(component.form.getRawValue()).toEqual({
            name: 'Ashmit',
            bio: '',
            interests: '',
            availability: '',
            skillLevel: '',
        });
    });

    it('calls PUT on submit and shows success snackbar', () => {
        getProfileMock.mockReturnValue(of(null));
        updateProfileMock.mockReturnValue(
            of({
                bio: 'Bio updated',
                interests: 'AI',
                availability: 'Weekends',
                skillLevel: 'Advanced',
            }),
        );

        const fixture = TestBed.createComponent(Profile);
        fixture.detectChanges();

        const component = fixture.componentInstance;
        const snackSpy = vi.spyOn((component as any).snackBar, 'open');
        component.form.setValue({
            name: 'Ashmit Gupta',
            bio: 'Bio updated',
            interests: 'AI',
            availability: 'Weekends',
            skillLevel: 'Advanced',
        });

        component.saveProfile();

        expect(updateProfileMock).toHaveBeenCalledWith({
            bio: 'Bio updated',
            interests: 'AI',
            availability: 'Weekends',
            skillLevel: 'Advanced',
        });
        expect(updateCurrentUserNameMock).toHaveBeenCalledWith('Ashmit Gupta');
        expect(snackSpy).toHaveBeenCalledWith('Profile saved successfully.', 'Close', {
            duration: 2500,
        });
        expect(component.saveError()).toBe('');
        expect(component.isEditing()).toBe(false);
        expect(component.hasSavedProfile()).toBe(true);
    });

    it('shows inline save error when update fails', () => {
        getProfileMock.mockReturnValue(of(null));
        updateProfileMock.mockReturnValue(
            throwError(() => ({
                status: 500,
                error: 'Backend exploded',
            })),
        );

        const fixture = TestBed.createComponent(Profile);
        fixture.detectChanges();

        const component = fixture.componentInstance;
        const snackSpy = vi.spyOn((component as any).snackBar, 'open');
        component.saveProfile();

        expect(component.saveError()).toBe('Backend exploded');
        expect(snackSpy).not.toHaveBeenCalled();
    });
});
