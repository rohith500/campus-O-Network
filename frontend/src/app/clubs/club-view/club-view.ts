import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Club, ClubMember, ClubService } from '../../core/club.service';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-club-view',
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './club-view.html',
  styleUrl: './club-view.css',
})
export class ClubView implements OnInit {
  loading = signal(true);
  error = signal('');
  actionError = signal('');
  authError = signal('');
  actionLoading = signal(false);

  club = signal<Club | null>(null);
  members = signal<ClubMember[]>([]);
  admins = signal<ClubMember[]>([]);
  memberCount = signal(0);
  isMember = signal(false);
  tags = signal<string[]>([]);

  private clubId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private clubs: ClubService,
    private auth: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = Number(idParam);

    if (!idParam || Number.isNaN(id) || id <= 0) {
      this.error.set('Invalid club id.');
      this.loading.set(false);
      return;
    }

    this.clubId = id;
    this.loadClubDetails();
  }

  joinClub(): void {
    if (!this.clubId) return;

    const token = this.auth.getToken();
    if (!token) {
      this.authError.set('Please sign in to join this club.');
      return;
    }

    this.actionLoading.set(true);
    this.actionError.set('');
    this.authError.set('');

    this.clubs.joinClub(this.clubId, token).subscribe({
      next: () => {
        this.actionLoading.set(false);
        this.loadClubDetails();
      },
      error: (error: HttpErrorResponse) => {
        this.actionLoading.set(false);
        this.handleActionError(error, 'Unable to join this club.');
      },
    });
  }

  leaveClub(): void {
    if (!this.clubId) return;

    const token = this.auth.getToken();
    if (!token) {
      this.authError.set('Please sign in to leave this club.');
      return;
    }

    this.actionLoading.set(true);
    this.actionError.set('');
    this.authError.set('');

    this.clubs.leaveClub(this.clubId, token).subscribe({
      next: () => {
        this.actionLoading.set(false);
        this.loadClubDetails();
      },
      error: (error: HttpErrorResponse) => {
        this.actionLoading.set(false);
        this.handleActionError(error, 'Unable to leave this club.');
      },
    });
  }

  retryLoad(): void {
    this.loadClubDetails();
  }

  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  private loadClubDetails(): void {
    if (!this.clubId) return;

    this.loading.set(true);
    this.error.set('');
    this.actionError.set('');

    this.clubs.getClubDetail(this.clubId).subscribe({
      next: (res) => {
        this.club.set(res.club);
        this.members.set(res.members);
        this.memberCount.set(res.members.length);
        this.admins.set(
          res.members.filter((member) => {
            const role = (member.role ?? '').toLowerCase();
            return role === 'admin' || role === 'ambassador';
          }),
        );

        this.tags.set(this.extractTags(res.club.description));
        this.isMember.set(this.computeMembership(res.members));

        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 401 || error.status === 403) {
          this.authError.set('You are not authorized to view this club. Please sign in again.');
        }
        this.error.set('Failed to load club details.');
        this.loading.set(false);
      },
    });
  }

  private computeMembership(members: ClubMember[]): boolean {
    const currentUserId = this.auth.getCurrentUser()?.id;
    if (!currentUserId) return false;

    return members.some((member) => member.user_id === currentUserId);
  }

  private extractTags(description: string): string[] {
    if (!description) return [];

    const hashtagMatches = description.match(/#[\w-]+/g) ?? [];
    const normalized = hashtagMatches.map((tag) => tag.toLowerCase());
    return Array.from(new Set(normalized));
  }

  private handleActionError(error: HttpErrorResponse, fallback: string): void {
    if (error.status === 401 || error.status === 403) {
      this.authError.set('Your session is not authorized for this action. Please sign in again.');
      this.actionError.set('');
      return;
    }

    const message =
      typeof error.error === 'string' && error.error.trim().length > 0
        ? error.error.trim()
        : fallback;
    this.actionError.set(message);
  }
}
