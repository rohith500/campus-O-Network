import { Component, OnInit, computed, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService, FeedPost } from '../core/auth.service';
import { EventModel, EventService } from '../core/event.service';
import { FeedComment, FeedInteractionService } from '../core/feed-interaction.service';

@Component({
  selector: 'app-feed',
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './feed.html',
  styleUrl: './feed.css',
})
export class Feed implements OnInit {
  posts = signal<FeedPost[]>([]);
  events = signal<EventModel[]>([]);
  loading = signal(true);
  error = signal(false);
  eventsError = signal(false);
  canManageClubs = signal(false);
  likePendingByPostId = signal<Record<number, boolean>>({});
  likeErrorByPostId = signal<Record<number, string>>({});
  commentsOpenByPostId = signal<Record<number, boolean>>({});
  commentsLoadingByPostId = signal<Record<number, boolean>>({});
  commentsByPostId = signal<Record<number, FeedComment[]>>({});
  commentsErrorByPostId = signal<Record<number, string>>({});
  commentDraftByPostId = signal<Record<number, string>>({});
  commentSubmittingByPostId = signal<Record<number, boolean>>({});
  deletingCommentById = signal<Record<number, boolean>>({});
  likedPostById = signal<Record<number, boolean>>({});
  composerExpanded = signal(false);
  composerContent = signal('');
  composerTags = signal('');
  composerSubmitting = signal(false);
  composerError = signal('');
  currentPostsPage = signal(1);
  readonly postsPageSize = 8;
  readonly totalPostPages = computed(() => {
    const total = this.posts().length;
    return Math.max(1, Math.ceil(total / this.postsPageSize));
  });
  readonly pagedPosts = computed(() => {
    const safePage = Math.min(this.currentPostsPage(), this.totalPostPages());
    const start = (safePage - 1) * this.postsPageSize;
    const end = start + this.postsPageSize;
    return this.posts().slice(start, end);
  });

  constructor(
    private auth: AuthService,
    private eventsService: EventService,
    private feedInteractions: FeedInteractionService,
    private router: Router,
  ) { }

  ngOnInit() {
    const role = this.auth.getCurrentUserRole();
    this.canManageClubs.set(role === 'admin' || role === 'ambassador');

    this.auth.getFeed().subscribe({
      next: (res) => {
        this.posts.set(res.posts);
        this.currentPostsPage.set(1);
        this.loadLikedPostsFromStorage();
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });

    this.eventsService.listEvents().subscribe({
      next: (events) => {
        this.events.set(events);
      },
      error: () => {
        this.eventsError.set(true);
      },
    });
  }

  logout() {
    this.auth.logout();
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  getAvatarColor(id: number | string): string {
    const colors = ['#6C63FF', '#FF6584', '#43B89C', '#FF9F43', '#4ECDC4', '#A29BFE'];
    const index = Math.abs(Number(id) || 0) % colors.length;
    return colors[index];
  }

  likePost(postId: number): void {
    if (!this.ensureSignedIn()) {
      return;
    }
    if (this.likePending(postId)) {
      return;
    }
    if (this.hasLiked(postId)) {
      return;
    }

    const post = this.posts().find((item) => item.id === postId);
    if (!post) {
      return;
    }

    const previousLikes = post.likes;
    this.setLikeError(postId, '');
    this.setLikePending(postId, true);
    this.updatePostLikes(postId, previousLikes + 1);

    this.feedInteractions.likePost(postId).subscribe({
      next: (response) => {
        this.updatePostLikes(postId, response.likes);
        this.setLikePending(postId, false);
        this.markPostLiked(postId);
      },
      error: () => {
        this.updatePostLikes(postId, previousLikes);
        this.setLikePending(postId, false);
        this.setLikeError(postId, 'Failed to like post. Please try again.');
      },
    });
  }

  toggleComposer(): void {
    this.composerExpanded.set(!this.composerExpanded());
    if (!this.composerExpanded()) {
      this.composerError.set('');
    }
  }

  updateComposerContent(value: string): void {
    this.composerContent.set(value);
  }

  updateComposerTags(value: string): void {
    this.composerTags.set(value);
  }

  submitPost(): void {
    if (!this.ensureSignedIn()) {
      return;
    }
    if (this.composerSubmitting()) {
      return;
    }

    const content = this.composerContent().trim();
    const tags = this.composerTags().trim();

    if (!content) {
      this.composerError.set('Post content is required.');
      return;
    }

    this.composerError.set('');
    this.composerSubmitting.set(true);

    this.feedInteractions.createPost(content, tags).subscribe({
      next: (created) => {
        const currentUser = this.auth.getCurrentUser();
        const newPost: FeedPost = {
          id: created.id,
          userId: created.userId,
          name: currentUser?.name ?? `User #${created.userId || 'Unknown'}`,
          description: created.content,
          likes: created.likes,
          createdAt: created.createdAt,
          updatedAt: created.updatedAt,
        };

        this.posts.update((posts) => [newPost, ...posts]);
        this.currentPostsPage.set(1);
        this.composerContent.set('');
        this.composerTags.set('');
        this.composerExpanded.set(false);
        this.composerSubmitting.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.composerSubmitting.set(false);
        this.composerError.set(this.toComposerErrorMessage(error));

        if (error.status === 401) {
          this.router.navigate(['/auth/login']);
        }
      },
    });
  }

  likePending(postId: number): boolean {
    return !!this.likePendingByPostId()[postId];
  }

  postPageNumbers(): number[] {
    const total = this.totalPostPages();
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  goToPostPage(page: number): void {
    const total = this.totalPostPages();
    if (page < 1 || page > total) {
      return;
    }
    this.currentPostsPage.set(page);
  }

  prevPostPage(): void {
    if (this.currentPostsPage() <= 1) {
      return;
    }
    this.currentPostsPage.set(this.currentPostsPage() - 1);
  }

  nextPostPage(): void {
    if (this.currentPostsPage() >= this.totalPostPages()) {
      return;
    }
    this.currentPostsPage.set(this.currentPostsPage() + 1);
  }

  hasLiked(postId: number): boolean {
    return !!this.likedPostById()[postId];
  }

  likeError(postId: number): string {
    return this.likeErrorByPostId()[postId] ?? '';
  }

  toggleComments(postId: number): void {
    const isOpen = this.commentsOpen(postId);
    this.commentsOpenByPostId.update((state) => ({
      ...state,
      [postId]: !isOpen,
    }));

    if (!isOpen && !this.hasLoadedComments(postId)) {
      this.loadComments(postId);
    }
  }

  commentsOpen(postId: number): boolean {
    return !!this.commentsOpenByPostId()[postId];
  }

  commentsLoading(postId: number): boolean {
    return !!this.commentsLoadingByPostId()[postId];
  }

  commentsForPost(postId: number): FeedComment[] {
    return this.commentsByPostId()[postId] ?? [];
  }

  commentsError(postId: number): string {
    return this.commentsErrorByPostId()[postId] ?? '';
  }

  commentDraft(postId: number): string {
    return this.commentDraftByPostId()[postId] ?? '';
  }

  updateCommentDraft(postId: number, value: string): void {
    this.commentDraftByPostId.update((state) => ({
      ...state,
      [postId]: value,
    }));
  }

  commentSubmitting(postId: number): boolean {
    return !!this.commentSubmittingByPostId()[postId];
  }

  createComment(postId: number): void {
    if (!this.ensureSignedIn()) {
      return;
    }

    if (this.commentSubmitting(postId)) {
      return;
    }

    const content = this.commentDraft(postId).trim();
    if (!content) {
      this.setCommentsError(postId, 'Comment cannot be empty.');
      return;
    }

    const currentUser = this.auth.getCurrentUser();
    const temporaryId = -Date.now();
    const optimisticComment: FeedComment = {
      id: temporaryId,
      postId,
      userId: currentUser?.id ?? 0,
      content,
      createdAt: new Date().toISOString(),
    };

    this.setCommentsError(postId, '');
    this.setCommentSubmitting(postId, true);
    this.addComment(postId, optimisticComment);
    this.updateCommentDraft(postId, '');

    this.feedInteractions.createComment(postId, content).subscribe({
      next: (savedComment) => {
        this.replaceComment(postId, temporaryId, savedComment);
        this.setCommentSubmitting(postId, false);
      },
      error: (error: HttpErrorResponse) => {
        this.removeComment(postId, temporaryId);
        this.setCommentSubmitting(postId, false);
        this.setCommentsError(postId, this.toCommentErrorMessage(error));
        this.updateCommentDraft(postId, content);

        if (error.status === 401) {
          this.router.navigate(['/auth/login']);
        }
      },
    });
  }

  canDeleteComment(comment: FeedComment): boolean {
    const userId = this.auth.getCurrentUser()?.id;
    return !!userId && userId === comment.userId;
  }

  deletingComment(commentId: number): boolean {
    return !!this.deletingCommentById()[commentId];
  }

  deleteComment(postId: number, commentId: number): void {
    if (!this.ensureSignedIn()) {
      return;
    }
    if (this.deletingComment(commentId)) {
      return;
    }

    this.setCommentsError(postId, '');
    this.setDeletingComment(commentId, true);

    this.feedInteractions.deleteComment(postId, commentId).subscribe({
      next: () => {
        this.removeComment(postId, commentId);
        this.setDeletingComment(commentId, false);
      },
      error: (error: HttpErrorResponse) => {
        this.setDeletingComment(commentId, false);
        this.setCommentsError(postId, this.toDeleteCommentErrorMessage(error));

        if (error.status === 401) {
          this.router.navigate(['/auth/login']);
        }
      },
    });
  }

  commentAuthor(comment: FeedComment): string {
    return `User #${comment.userId || 'Unknown'}`;
  }

  formatCommentTime(dateValue?: string): string {
    if (!dateValue) {
      return 'Just now';
    }
    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) {
      return 'Just now';
    }
    return parsed.toLocaleString();
  }

  formatEventDate(dateValue: string): string {
    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) {
      return 'Date TBD';
    }
    return parsed.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  private ensureSignedIn(): boolean {
    if (this.auth.getToken()) {
      return true;
    }
    this.router.navigate(['/auth/login']);
    return false;
  }

  private updatePostLikes(postId: number, likes: number): void {
    this.posts.update((items) =>
      items.map((post) =>
        post.id === postId
          ? {
            ...post,
            likes,
          }
          : post,
      ),
    );
  }

  private setLikePending(postId: number, pending: boolean): void {
    this.likePendingByPostId.update((state) => ({
      ...state,
      [postId]: pending,
    }));
  }

  private setLikeError(postId: number, message: string): void {
    this.likeErrorByPostId.update((state) => ({
      ...state,
      [postId]: message,
    }));
  }

  private hasLoadedComments(postId: number): boolean {
    return Object.prototype.hasOwnProperty.call(this.commentsByPostId(), postId);
  }

  private loadComments(postId: number): void {
    this.setCommentsLoading(postId, true);
    this.setCommentsError(postId, '');

    this.feedInteractions.getComments(postId).subscribe({
      next: (comments) => {
        this.commentsByPostId.update((state) => ({
          ...state,
          [postId]: comments,
        }));
        this.setCommentsLoading(postId, false);
      },
      error: () => {
        this.setCommentsLoading(postId, false);
        this.setCommentsError(postId, 'Failed to load comments. Please try again.');
      },
    });
  }

  private setCommentsLoading(postId: number, loading: boolean): void {
    this.commentsLoadingByPostId.update((state) => ({
      ...state,
      [postId]: loading,
    }));
  }

  private setCommentsError(postId: number, message: string): void {
    this.commentsErrorByPostId.update((state) => ({
      ...state,
      [postId]: message,
    }));
  }

  private setCommentSubmitting(postId: number, submitting: boolean): void {
    this.commentSubmittingByPostId.update((state) => ({
      ...state,
      [postId]: submitting,
    }));
  }

  private addComment(postId: number, comment: FeedComment): void {
    this.commentsByPostId.update((state) => ({
      ...state,
      [postId]: [...(state[postId] ?? []), comment],
    }));
  }

  private replaceComment(postId: number, sourceId: number, target: FeedComment): void {
    this.commentsByPostId.update((state) => ({
      ...state,
      [postId]: (state[postId] ?? []).map((comment) => (comment.id === sourceId ? target : comment)),
    }));
  }

  private removeComment(postId: number, commentId: number): void {
    this.commentsByPostId.update((state) => ({
      ...state,
      [postId]: (state[postId] ?? []).filter((comment) => comment.id !== commentId),
    }));
  }

  private setDeletingComment(commentId: number, deleting: boolean): void {
    this.deletingCommentById.update((state) => ({
      ...state,
      [commentId]: deleting,
    }));
  }

  private toCommentErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 400) {
      return 'Comment content is required.';
    }
    if (error.status === 401) {
      return 'Please sign in to add comments.';
    }
    return 'Failed to add comment. Please try again.';
  }

  private toDeleteCommentErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 401) {
      return 'Please sign in again to delete your comment.';
    }
    if (error.status === 404) {
      return 'Comment was not found.';
    }
    return 'Failed to delete comment. Please try again.';
  }

  private toComposerErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 400) {
      return 'Post content cannot be empty.';
    }
    if (error.status === 401) {
      return 'Please sign in to publish a post.';
    }
    return 'Failed to publish post. Please try again.';
  }

  private likedPostsStorageKey(): string {
    const userId = this.auth.getCurrentUser()?.id ?? 'anonymous';
    return `campusnet_liked_posts_${userId}`;
  }

  private loadLikedPostsFromStorage(): void {
    const raw = localStorage.getItem(this.likedPostsStorageKey());
    if (!raw) {
      this.likedPostById.set({});
      return;
    }

    try {
      const ids = JSON.parse(raw) as number[];
      const mapped: Record<number, boolean> = {};
      for (const id of ids) {
        mapped[id] = true;
      }
      this.likedPostById.set(mapped);
    } catch {
      this.likedPostById.set({});
    }
  }

  private markPostLiked(postId: number): void {
    this.likedPostById.update((state) => {
      const next = {
        ...state,
        [postId]: true,
      };
      const ids = Object.keys(next)
        .filter((id) => next[Number(id)])
        .map((id) => Number(id));
      localStorage.setItem(this.likedPostsStorageKey(), JSON.stringify(ids));
      return next;
    });
  }
}
