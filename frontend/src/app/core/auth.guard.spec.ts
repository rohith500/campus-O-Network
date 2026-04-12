import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
    let navigateMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        navigateMock = vi.fn();
    });

    it('allows access when logged in', () => {
        TestBed.configureTestingModule({
            providers: [
                {
                    provide: AuthService,
                    useValue: {
                        isLoggedIn: () => true,
                    },
                },
                {
                    provide: Router,
                    useValue: {
                        navigate: navigateMock,
                    },
                },
            ],
        });

        const result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

        expect(result).toBe(true);
        expect(navigateMock).not.toHaveBeenCalled();
    });

    it('redirects to /auth/login when not logged in', () => {
        TestBed.configureTestingModule({
            providers: [
                {
                    provide: AuthService,
                    useValue: {
                        isLoggedIn: () => false,
                    },
                },
                {
                    provide: Router,
                    useValue: {
                        navigate: navigateMock,
                    },
                },
            ],
        });

        const result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

        expect(result).toBe(false);
        expect(navigateMock).toHaveBeenCalledWith(['/auth/login']);
    });
});
