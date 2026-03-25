import { TestBed } from '@angular/core/testing';
import { HttpRequest, HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';
import { API_BASE_URL } from './api/api.config';
import { AuthService } from './auth.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  it('adds Authorization header for API base URL when token exists', () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: {
            getToken: () => 'test-token',
          },
        },
      ],
    });

    const req = new HttpRequest('GET', `${API_BASE_URL}/clubs`);
    let captured = req;

    TestBed.runInInjectionContext(() =>
      authInterceptor(req, (outReq) => {
        captured = outReq;
        return of(new HttpResponse({ status: 200 }));
      }),
    ).subscribe();

    expect(captured.headers.get('Authorization')).toBe('Bearer test-token');
  });

  it('does not add Authorization header for non-API URLs', () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: {
            getToken: () => 'test-token',
          },
        },
      ],
    });

    const req = new HttpRequest('GET', 'https://example.com/ping');
    let captured = req;

    TestBed.runInInjectionContext(() =>
      authInterceptor(req, (outReq) => {
        captured = outReq;
        return of(new HttpResponse({ status: 200 }));
      }),
    ).subscribe();

    expect(captured.headers.has('Authorization')).toBe(false);
  });
});
