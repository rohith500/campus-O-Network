import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { AuthService } from '../core/auth.service';
import { EventService } from '../core/event.service';
import { FeedInteractionService } from '../core/feed-interaction.service';
import { Feed } from './feed';

describe('Feed interactions', () => {
  let fixture: ComponentFixture<Feed>;
  let component: Feed;
  let router: Router;

  let authSpy: {
    getCurrentUserRole: ReturnType<typeof vi.fn>;
    getFeed: ReturnType<typeof vi.fn>;
    getCurrentUser: ReturnType<typeof vi.fn>;
    getToken: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
  };
  let eventsSpy: {
    listEvents: ReturnType<typeof vi.fn>;
  };
  let interactionSpy: {
    likePost: ReturnType<typeof vi.fn>;
    getComments: ReturnType<typeof vi.fn>;
    createComment: ReturnType<typeof vi.fn>;
    deleteComment: ReturnType<typeof vi.fn>;
    createPost: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    localStorage.clear();

    authSpy = {
      getCurrentUserRole: vi.fn(),
      getFeed: vi.fn(),
      getCurrentUser: vi.fn(),
      getToken: vi.fn(),
      logout: vi.fn(),
    };
    eventsSpy = {
      listEvents: vi.fn(),
    };
    interactionSpy = {
      likePost: vi.fn(),
      getComments: vi.fn(),
      createComment: vi.fn(),
      deleteComment: vi.fn(),
      createPost: vi.fn(),
    };

    authSpy.getCurrentUserRole.mockReturnValue('student');
    authSpy.getFeed.mockReturnValue(of({ posts: [] }));
    authSpy.getCurrentUser.mockReturnValue({ id: 7, email: 'u@ufl.edu', name: 'User', role: 'student' });
    authSpy.getToken.mockReturnValue('token-123');
    eventsSpy.listEvents.mockReturnValue(of([]));
    interactionSpy.likePost.mockReturnValue(of({ likes: 1 }));
    interactionSpy.getComments.mockReturnValue(of([]));
    interactionSpy.createComment.mockReturnValue(
      of({ id: 2, postId: 1, userId: 7, authorName: 'User', content: 'hello', createdAt: '2026-01-01T00:00:00Z' }),
    );
    interactionSpy.deleteComment.mockReturnValue(of(undefined));
    interactionSpy.createPost.mockReturnValue(
      of({ id: 101, userId: 7, content: 'new post', tags: 'news', likes: 0, createdAt: '2026-01-01T00:00:00Z' }),
    );

    await TestBed.configureTestingModule({
      imports: [Feed],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authSpy },
        { provide: EventService, useValue: eventsSpy },
        { provide: FeedInteractionService, useValue: interactionSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Feed);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
  });

  it('likes optimistically and prevents duplicate like while request is pending', () => {
    const pending$ = new Subject<{ likes: number }>();
    interactionSpy.likePost.mockReturnValue(pending$);
    component.posts.set([
      { id: 1, userId: 9, name: 'User #9', description: 'Post', likes: 3 },
    ]);

    component.likePost(1);
    component.likePost(1);

    expect(interactionSpy.likePost).toHaveBeenCalledTimes(1);
    expect(component.posts()[0].likes).toBe(4);
    expect(component.likePending(1)).toBe(true);

    pending$.next({ likes: 4 });
    pending$.complete();

    expect(component.likePending(1)).toBe(false);
    expect(component.posts()[0].likes).toBe(4);
  });

  it('rolls back optimistic like on error', () => {
    interactionSpy.likePost.mockReturnValue(throwError(() => new Error('boom')));
    component.posts.set([
      { id: 1, userId: 9, name: 'User #9', description: 'Post', likes: 2 },
    ]);

    component.likePost(1);

    expect(component.posts()[0].likes).toBe(2);
    expect(component.likeError(1)).toContain('Failed to like post');
  });

  it('redirects to login if unauthenticated user tries to like or comment', () => {
    authSpy.getToken.mockReturnValue(null);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    component.posts.set([
      { id: 1, userId: 9, name: 'User #9', description: 'Post', likes: 0 },
    ]);

    component.likePost(1);
    component.updateCommentDraft(1, 'Hello');
    component.createComment(1);

    expect(interactionSpy.likePost).not.toHaveBeenCalled();
    expect(interactionSpy.createComment).not.toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/auth/login']);
  });

  it('loads comments when opening comments panel', () => {
    interactionSpy.getComments.mockReturnValue(
      of([{ id: 11, postId: 1, userId: 3, authorName: 'Alice', content: 'Nice', createdAt: '2026-01-01T00:00:00Z' }]),
    );

    component.toggleComments(1);

    expect(component.commentsOpen(1)).toBe(true);
    expect(interactionSpy.getComments).toHaveBeenCalledWith(1);
    expect(component.commentsForPost(1).length).toBe(1);
  });

  it('adds comment optimistically then replaces temp comment with server result', () => {
    const pending$ = new Subject<{ id: number; postId: number; userId: number; authorName: string; content: string; createdAt: string }>();
    interactionSpy.createComment.mockReturnValue(pending$);

    component.commentsByPostId.set({ 1: [] });
    component.updateCommentDraft(1, 'First!');

    component.createComment(1);

    const optimistic = component.commentsForPost(1)[0];
    expect(optimistic.content).toBe('First!');
    expect(optimistic.id).toBeLessThan(0);

    pending$.next({ id: 30, postId: 1, userId: 7, authorName: 'User', content: 'First!', createdAt: '2026-01-01T00:00:00Z' });
    pending$.complete();

    const finalized = component.commentsForPost(1)[0];
    expect(finalized.id).toBe(30);
    expect(component.commentSubmitting(1)).toBe(false);
  });

  it('prefers the commenter display name when available', () => {
    expect(
      component.commentAuthor({ id: 1, postId: 1, userId: 7, authorName: 'Alice', content: 'Nice' }),
    ).toBe('Alice');
  });

  it('deletes own comment after successful API call', () => {
    component.commentsByPostId.set({
      1: [{ id: 99, postId: 1, userId: 7, content: 'remove me' }],
    });

    component.deleteComment(1, 99);

    expect(interactionSpy.deleteComment).toHaveBeenCalledWith(1, 99);
    expect(component.commentsForPost(1).length).toBe(0);
  });

  it('prevents reliking the same post after a successful like', () => {
    component.posts.set([
      { id: 1, userId: 9, name: 'User #9', description: 'Post', likes: 3 },
    ]);

    component.likePost(1);
    component.likePost(1);

    expect(interactionSpy.likePost).toHaveBeenCalledTimes(1);
    expect(component.hasLiked(1)).toBe(true);
  });

  it('loads liked posts from storage on init', () => {
    authSpy.getCurrentUser.mockReturnValue({ id: 42, email: 'u@ufl.edu', name: 'User', role: 'student' });
    localStorage.setItem('campusnet_liked_posts_42', JSON.stringify([10, 20]));
    authSpy.getFeed.mockReturnValue(
      of({
        posts: [
          { id: 10, userId: 1, name: 'User #1', description: 'A', likes: 1 },
          { id: 11, userId: 2, name: 'User #2', description: 'B', likes: 0 },
        ],
      }),
    );

    component.ngOnInit();

    expect(component.hasLiked(10)).toBe(true);
    expect(component.hasLiked(11)).toBe(false);
  });

  it('validates composer content before submit', () => {
    component.composerExpanded.set(true);
    component.updateComposerContent('   ');

    component.submitPost();

    expect(interactionSpy.createPost).not.toHaveBeenCalled();
    expect(component.composerError()).toContain('required');
  });

  it('creates post and prepends to feed without reload, then resets composer', () => {
    component.posts.set([
      { id: 1, userId: 9, name: 'User #9', description: 'older', likes: 2 },
    ]);
    component.composerExpanded.set(true);
    component.updateComposerContent('Campus update');
    component.updateComposerTags('announcement');

    component.submitPost();

    expect(interactionSpy.createPost).toHaveBeenCalledWith('Campus update', 'announcement');
    expect(component.posts()[0].description).toBe('new post');
    expect(component.posts()[0].name).toBe('User');
    expect(component.composerContent()).toBe('');
    expect(component.composerTags()).toBe('');
    expect(component.composerExpanded()).toBe(false);
  });

  it('prevents duplicate post submit while request is in flight', () => {
    const pending$ = new Subject<{ id: number; userId: number; content: string; tags: string; likes: number }>();
    interactionSpy.createPost.mockReturnValue(pending$);
    component.composerExpanded.set(true);
    component.updateComposerContent('One');

    component.submitPost();
    component.submitPost();

    expect(interactionSpy.createPost).toHaveBeenCalledTimes(1);
    expect(component.composerSubmitting()).toBe(true);

    pending$.next({ id: 200, userId: 7, content: 'One', tags: '', likes: 0 });
    pending$.complete();

    expect(component.composerSubmitting()).toBe(false);
  });

  it('shows user-facing 400 error when post create fails validation on backend', () => {
    interactionSpy.createPost.mockReturnValue(throwError(() => ({ status: 400 })));
    component.composerExpanded.set(true);
    component.updateComposerContent('Will fail');

    component.submitPost();

    expect(component.composerError()).toContain('cannot be empty');
  });

  it('shows 401 error and redirects to login on unauthorized post create', () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    interactionSpy.createPost.mockReturnValue(throwError(() => ({ status: 401 })));
    component.composerExpanded.set(true);
    component.updateComposerContent('Will fail auth');

    component.submitPost();

    expect(component.composerError()).toContain('sign in');
    expect(navigateSpy).toHaveBeenCalledWith(['/auth/login']);
  });

  it('paginates posts with at most 8 per page', () => {
    const manyPosts = Array.from({ length: 17 }, (_, i) => ({
      id: i + 1,
      userId: i + 1,
      name: `User #${i + 1}`,
      description: `Post ${i + 1}`,
      likes: 0,
    }));
    component.posts.set(manyPosts);

    expect(component.totalPostPages()).toBe(3);
    expect(component.pagedPosts().length).toBe(8);

    component.goToPostPage(2);
    expect(component.pagedPosts()[0].id).toBe(9);

    component.goToPostPage(3);
    expect(component.pagedPosts().length).toBe(1);
    expect(component.pagedPosts()[0].id).toBe(17);
  });

  it('resets posts pagination to first page after creating a new post', () => {
    const manyPosts = Array.from({ length: 9 }, (_, i) => ({
      id: i + 1,
      userId: i + 1,
      name: `User #${i + 1}`,
      description: `Post ${i + 1}`,
      likes: 0,
    }));
    component.posts.set(manyPosts);
    component.goToPostPage(2);
    component.composerExpanded.set(true);
    component.updateComposerContent('new content');

    component.submitPost();

    expect(component.currentPostsPage()).toBe(1);
    expect(component.pagedPosts()[0].id).toBe(101);
  });
});
