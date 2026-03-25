import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Club, ClubService } from '../../core/club.service';

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
  club = signal<Club | null>(null);
  memberCount = signal(0);

  constructor(
    private route: ActivatedRoute,
    private clubs: ClubService,
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = Number(idParam);

    if (!idParam || Number.isNaN(id) || id <= 0) {
      this.error.set('Invalid club id.');
      this.loading.set(false);
      return;
    }

    this.clubs.getClubDetail(id).subscribe({
      next: (res) => {
        this.club.set(res.club);
        this.memberCount.set(res.members.length);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load club details.');
        this.loading.set(false);
      },
    });
  }
}
