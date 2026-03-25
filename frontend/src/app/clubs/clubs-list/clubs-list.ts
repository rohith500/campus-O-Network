import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/auth.service';
import { Club, ClubService } from '../../core/club.service';

interface ClubCard extends Club {
  memberCount: number;
  isJoined: boolean;
  loadingMembership: boolean;
  actionError: string;
}

@Component({
  selector: 'app-clubs-list',
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './clubs-list.html',
  styleUrl: './clubs-list.css',
})
export class ClubsList implements OnInit {
  loading = signal(true);
  error = signal('');

  clubs = signal<ClubCard[]>([]);
  filteredClubs = signal<ClubCard[]>([]);
  pagedClubs = signal<ClubCard[]>([]);

  currentPage = signal(1);
  readonly pageSize = 6;
  totalPages = signal(1);

  canManageClubs = signal(false);
  currentUserId = signal<number | null>(null);

  readonly form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private clubsService: ClubService,
  ) {
    this.form = this.fb.group({
      search: [''],
      category: [''],
      tags: [''],
    });
  }

  ngOnInit(): void {
    const user = this.auth.getCurrentUser();
    this.currentUserId.set(user?.id ?? null);

    const role = this.auth.getCurrentUserRole();
    this.canManageClubs.set(role === 'admin' || role === 'ambassador');

    this.form.valueChanges.subscribe(() => {
      this.currentPage.set(1);
      this.applyFiltersAndPagination();
    });

    this.loadClubs();
  }

  loadClubs(): void {
    this.loading.set(true);
    this.error.set('');

    this.clubsService.listClubs().subscribe({
      next: (clubs) => {
        const cards: ClubCard[] = clubs.map((club) => ({
          ...club,
          memberCount: 0,
          isJoined: false,
          loadingMembership: true,
          actionError: '',
        }));

        this.clubs.set(cards);
        this.applyFiltersAndPagination();
        this.loading.set(false);

        cards.forEach((club) => this.loadClubMembership(club.id));
      },
      error: () => {
        this.error.set('Failed to load clubs. Please try again.');
        this.loading.set(false);
      },
    });
  }

  onNextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.set(this.currentPage() + 1);
      this.applyFiltersAndPagination();
    }
  }

  onPrevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.set(this.currentPage() - 1);
      this.applyFiltersAndPagination();
    }
  }

  joinClub(clubId: number): void {
    const token = this.auth.getToken();
    if (!token) {
      this.updateClubCard(clubId, {
        actionError: 'Please login to join clubs.',
      });
      return;
    }

    this.updateClubCard(clubId, { loadingMembership: true, actionError: '' });

    this.clubsService.joinClub(clubId, token).subscribe({
      next: () => {
        this.loadClubMembership(clubId);
      },
      error: (error: HttpErrorResponse) => {
        this.updateClubCard(clubId, {
          loadingMembership: false,
          actionError: this.errorMessageFrom(error, 'Failed to join club.'),
        });
      },
    });
  }

  leaveClub(clubId: number): void {
    const token = this.auth.getToken();
    if (!token) {
      this.updateClubCard(clubId, {
        actionError: 'Please login to leave clubs.',
      });
      return;
    }

    this.updateClubCard(clubId, { loadingMembership: true, actionError: '' });

    this.clubsService.leaveClub(clubId, token).subscribe({
      next: () => {
        this.loadClubMembership(clubId);
      },
      error: (error: HttpErrorResponse) => {
        this.updateClubCard(clubId, {
          loadingMembership: false,
          actionError: this.errorMessageFrom(error, 'Failed to leave club.'),
        });
      },
    });
  }

  private loadClubMembership(clubId: number): void {
    this.clubsService.getClubDetail(clubId).subscribe({
      next: (res) => {
        const userId = this.currentUserId();
        const memberCount = res.members.length;
        const isJoined = userId
          ? res.members.some((member) => (member.user_id ?? 0) === userId)
          : false;

        this.updateClubCard(clubId, {
          memberCount,
          isJoined,
          loadingMembership: false,
          actionError: '',
        });
      },
      error: () => {
        this.updateClubCard(clubId, {
          loadingMembership: false,
        });
      },
    });
  }

  private applyFiltersAndPagination(): void {
    const search = (this.form.value.search ?? '').toLowerCase().trim();
    const category = (this.form.value.category ?? '').toLowerCase().trim();
    const tags = (this.form.value.tags ?? '').toLowerCase().trim();

    const filtered = this.clubs().filter((club) => {
      const haystack = `${club.name} ${club.description}`.toLowerCase();
      const searchOk = !search || haystack.includes(search);
      const categoryOk = !category || haystack.includes(category);
      const tagsOk = !tags || haystack.includes(tags);
      return searchOk && categoryOk && tagsOk;
    });

    this.filteredClubs.set(filtered);

    const totalPages = Math.max(1, Math.ceil(filtered.length / this.pageSize));
    if (this.currentPage() > totalPages) {
      this.currentPage.set(totalPages);
    }

    this.totalPages.set(totalPages);

    const start = (this.currentPage() - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.pagedClubs.set(filtered.slice(start, end));
  }

  private updateClubCard(clubId: number, updates: Partial<ClubCard>): void {
    const next = this.clubs().map((club) =>
      club.id === clubId
        ? {
            ...club,
            ...updates,
          }
        : club,
    );

    this.clubs.set(next);
    this.applyFiltersAndPagination();
  }

  private errorMessageFrom(error: HttpErrorResponse, fallback: string): string {
    return typeof error.error === 'string' && error.error.trim().length > 0
      ? error.error.trim()
      : fallback;
  }
}
