import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

export interface FeedComment {
  id: number;
  postId: number;
  userId: number;
  authorName?: string;
  content: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FeedPostCreateResult {
  id: number;
  userId: number;
  content: string;
  tags: string;
  likes: number;
  createdAt?: string;
  updatedAt?: string;
}

interface LikePostResponse {
  ok?: boolean;
  likes?: number;
}

interface CommentsResponse {
  ok?: boolean;
  comments?: ApiComment[];
}

interface CreateCommentResponse {
  ok?: boolean;
  comment?: ApiComment;
}

interface ApiComment {
  authorName?: string;
  AuthorName?: string;
  author_name?: string;
  id?: number;
  ID?: number;
  post_id?: number;
  postId?: number;
  PostID?: number;
  user_id?: number;
  userId?: number;
  UserID?: number;
  content?: string;
  Content?: string;
  created_at?: string;
  createdAt?: string;
  CreatedAt?: string;
  updated_at?: string;
  updatedAt?: string;
  UpdatedAt?: string;
}

interface ApiPost {
  id?: number;
  ID?: number;
  user_id?: number;
  userId?: number;
  UserID?: number;
  content?: string;
  Content?: string;
  tags?: string;
  Tags?: string;
  likes?: number;
  Likes?: number;
  created_at?: string;
  createdAt?: string;
  CreatedAt?: string;
  updated_at?: string;
  updatedAt?: string;
  UpdatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class FeedInteractionService {
  private readonly apiBase = 'http://localhost:8079';

  constructor(private readonly http: HttpClient) {}

  likePost(postId: number): Observable<{ likes: number }> {
    return this.http
      .post<LikePostResponse>(`${this.apiBase}/feed/${postId}/like`, {})
      .pipe(map((response) => ({ likes: Number(response.likes ?? 0) })));
  }

  getComments(postId: number): Observable<FeedComment[]> {
    return this.http
      .get<CommentsResponse>(`${this.apiBase}/feed/${postId}/comments`)
      .pipe(map((response) => (response.comments ?? []).map((comment) => this.normalizeComment(comment))));
  }

  createComment(postId: number, content: string): Observable<FeedComment> {
    return this.http
      .post<CreateCommentResponse>(`${this.apiBase}/feed/${postId}/comments`, { content })
      .pipe(map((response) => this.normalizeComment(response.comment ?? {})));
  }

  createPost(content: string, tags: string): Observable<FeedPostCreateResult> {
    return this.http
      .post<ApiPost>(`${this.apiBase}/feed/create`, { content, tags })
      .pipe(map((response) => this.normalizePost(response)));
  }

  deleteComment(postId: number, commentId: number): Observable<void> {
    return this.http
      .delete<{ ok?: boolean }>(`${this.apiBase}/feed/${postId}/comments/${commentId}`)
      .pipe(map(() => undefined));
  }

  private normalizeComment(comment: ApiComment): FeedComment {
    return {
      id: Number(comment.id ?? comment.ID ?? 0),
      postId: Number(comment.post_id ?? comment.postId ?? comment.PostID ?? 0),
      userId: Number(comment.user_id ?? comment.userId ?? comment.UserID ?? 0),
      authorName: comment.authorName ?? comment.AuthorName ?? comment.author_name,
      content: String(comment.content ?? comment.Content ?? ''),
      createdAt: comment.created_at ?? comment.createdAt ?? comment.CreatedAt,
      updatedAt: comment.updated_at ?? comment.updatedAt ?? comment.UpdatedAt,
    };
  }

  private normalizePost(post: ApiPost): FeedPostCreateResult {
    return {
      id: Number(post.id ?? post.ID ?? 0),
      userId: Number(post.user_id ?? post.userId ?? post.UserID ?? 0),
      content: String(post.content ?? post.Content ?? ''),
      tags: String(post.tags ?? post.Tags ?? ''),
      likes: Number(post.likes ?? post.Likes ?? 0),
      createdAt: post.created_at ?? post.createdAt ?? post.CreatedAt,
      updatedAt: post.updated_at ?? post.updatedAt ?? post.UpdatedAt,
    };
  }
}
