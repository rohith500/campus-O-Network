import { Component, OnInit, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService, FeedPost } from '../core/auth.service';

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
  loading = signal(true);
  error = signal(false);

  constructor(private auth: AuthService) {}

  ngOnInit() {
    this.auth.getFeed().subscribe({
      next: (res) => {
        this.posts.set(res.posts);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
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

  getAvatarColor(id: string): string {
    const colors = ['#6C63FF', '#FF6584', '#43B89C', '#FF9F43', '#4ECDC4', '#A29BFE'];
    const index = id.charCodeAt(0) % colors.length;
    return colors[index];
  }
}
