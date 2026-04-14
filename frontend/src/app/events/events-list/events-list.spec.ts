import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { EventService } from '../../core/event.service';
import { EventsList } from './events-list';

describe('EventsList RSVP', () => {
  let fixture: ComponentFixture<EventsList>;
  let component: EventsList;
  let router: Router;

  let eventServiceSpy: {
    listEvents: ReturnType<typeof vi.fn>;
    getEventRsvpStatus: ReturnType<typeof vi.fn>;
    rsvpEvent: ReturnType<typeof vi.fn>;
    toListErrorMessage: ReturnType<typeof vi.fn>;
  };
  let authServiceSpy: {
    getCurrentUserRole: ReturnType<typeof vi.fn>;
    getCurrentUser: ReturnType<typeof vi.fn>;
    getToken: ReturnType<typeof vi.fn>;
  };

  const baseEvent = {
    id: 10,
    clubId: 2,
    creatorId: 7,
    title: 'Hack Night',
    description: 'Build things',
    date: '2026-06-01T18:00:00Z',
    location: 'Innovation Hub',
    capacity: 100,
    rsvpStatus: 'none' as const,
  };

  beforeEach(async () => {
    eventServiceSpy = {
      listEvents: vi.fn(),
      getEventRsvpStatus: vi.fn(),
      rsvpEvent: vi.fn(),
      toListErrorMessage: vi.fn(),
    };
    authServiceSpy = {
      getCurrentUserRole: vi.fn(),
      getCurrentUser: vi.fn(),
      getToken: vi.fn(),
    };

    eventServiceSpy.listEvents.mockReturnValue(of([]));
    eventServiceSpy.getEventRsvpStatus.mockReturnValue(of('none'));
    eventServiceSpy.toListErrorMessage.mockReturnValue('Failed to load events.');
    authServiceSpy.getCurrentUserRole.mockReturnValue('student');
    authServiceSpy.getCurrentUser.mockReturnValue({ id: 99, email: 's@u.edu', name: 'Student', role: 'student' });
    authServiceSpy.getToken.mockReturnValue('token-123');

    await TestBed.configureTestingModule({
      imports: [EventsList],
      providers: [
        provideRouter([]),
        { provide: EventService, useValue: eventServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EventsList);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
  });

  it('optimistically updates RSVP and prevents duplicate submit while in flight', () => {
    const request$ = new Subject<{ status: string }>();
    eventServiceSpy.rsvpEvent.mockReturnValue(request$);
    component.events.set([{ ...baseEvent }]);

    component.setRsvp(baseEvent.id, 'going');
    component.setRsvp(baseEvent.id, 'maybe');

    expect(eventServiceSpy.rsvpEvent).toHaveBeenCalledTimes(1);
    expect(component.events()[0].rsvpStatus).toBe('going');
    expect(component.isRsvpPending(baseEvent.id)).toBe(true);

    request$.next({ status: 'going' });
    request$.complete();

    expect(component.isRsvpPending(baseEvent.id)).toBe(false);
    expect(component.events()[0].rsvpStatus).toBe('going');
    expect(component.rsvpError(baseEvent.id)).toBe('');
  });

  it('redirects to login when user attempts RSVP without token', () => {
    authServiceSpy.getToken.mockReturnValue(null);
    component.events.set([{ ...baseEvent }]);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component.setRsvp(baseEvent.id, 'maybe');

    expect(eventServiceSpy.rsvpEvent).not.toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/auth/login']);
  });

  it('surfaces inline 400 error and reverts optimistic status', () => {
    const previous = { ...baseEvent, rsvpStatus: 'going' as const };
    component.events.set([previous]);
    eventServiceSpy.rsvpEvent.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 400, statusText: 'Bad Request' })),
    );

    component.setRsvp(baseEvent.id, 'maybe');

    expect(component.events()[0].rsvpStatus).toBe('going');
    expect(component.rsvpError(baseEvent.id)).toContain('Invalid RSVP status');
    expect(component.isRsvpPending(baseEvent.id)).toBe(false);
  });

  it('surfaces inline 404 error and reverts optimistic status', () => {
    component.events.set([{ ...baseEvent }]);
    eventServiceSpy.rsvpEvent.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 404, statusText: 'Not Found' })),
    );

    component.setRsvp(baseEvent.id, 'not_going');

    expect(component.events()[0].rsvpStatus).toBe('none');
    expect(component.rsvpError(baseEvent.id)).toContain('Event not found');
  });

  it('surfaces inline 401 error and redirects to login', () => {
    component.events.set([{ ...baseEvent }]);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    eventServiceSpy.rsvpEvent.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' })),
    );

    component.setRsvp(baseEvent.id, 'going');

    expect(component.rsvpError(baseEvent.id)).toContain('session has expired');
    expect(navigateSpy).toHaveBeenCalledWith(['/auth/login']);
  });
});
