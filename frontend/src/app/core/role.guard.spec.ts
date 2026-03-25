import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { roleGuard } from './role.guard';

describe('roleGuard', () => {
  let navigateMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    navigateMock = vi.fn();
  });

  it('allows access when user role is in allowed roles', () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: {
            getCurrentUserRole: () => 'admin',
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

    const route = { data: { roles: ['admin', 'ambassador'] } } as unknown as ActivatedRouteSnapshot;
    const state = {} as any;
    const result = TestBed.runInInjectionContext(() => roleGuard(route, state));

    expect(result).toBe(true);
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('redirects to feed when role is not allowed', () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: {
            getCurrentUserRole: () => 'student',
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

    const route = { data: { roles: ['admin', 'ambassador'] } } as unknown as ActivatedRouteSnapshot;
    const state = {} as any;
    const result = TestBed.runInInjectionContext(() => roleGuard(route, state));

    expect(result).toBe(false);
    expect(navigateMock).toHaveBeenCalledWith(['/feed']);
  });
});
