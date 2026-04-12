import { Component, OnInit, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService, FeedPost } from '../core/auth.service';
import { EventModel, EventService } from '../core/event.service';
import { ProfileService } from '../core/profile.service';

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
  canManageStudents = signal(false);
  sidebarName = signal('User');
  sidebarBio = signal('CampusNet member');

  constructor(
    private auth: AuthService,
    private eventsService: EventService,
    private profileService: ProfileService,
  ) { }

  ngOnInit() {
    const role = this.auth.getCurrentUserRole();
    const userName = this.auth.getCurrentUser()?.name?.trim();
    if (userName) {
      this.sidebarName.set(userName);
    }
    this.canManageClubs.set(role === 'admin' || role === 'ambassador');
    this.canManageStudents.set(role === 'admin');

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

    this.eventsService.listEvents().subscribe({
      next: (events) => {
        this.events.set(events);
      },
      error: () => {
        this.eventsError.set(true);
      },
    });

    this.profileService.getProfile().subscribe({
      next: (profile) => {
        if (!profile) {
          return;
        }

        const profileName = profile.name.trim();
        if (profileName) {
          this.sidebarName.set(profileName);
        }

        const profileBio = profile.bio.trim();
        this.sidebarBio.set(profileBio || 'CampusNet member');
      },
      error: () => {
        // Keep existing badge fallback values when profile fetch fails.
      },
    });
  }

  logout() {
    this.auth.logout();
  }

  getInitials(name: string): string {
    const trimmed = name.trim();
    if (!trimmed) {
      return 'U';
    }

    return trimmed
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
}
