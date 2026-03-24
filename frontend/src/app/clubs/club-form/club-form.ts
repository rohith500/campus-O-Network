import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/auth.service';
import { ClubRequest, ClubService } from '../../core/club.service';

@Component({
  selector: 'app-club-form',
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './club-form.html',
  styleUrl: './club-form.css',
})
export class ClubForm implements OnInit {
  loading = signal(false);
  initializing = signal(false);
  isEditMode = signal(false);
  formError = signal('');
  fieldErrors = signal<Record<string, string>>({});
  private editClubId: number | null = null;

  readonly form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private clubs: ClubService,
    private route: ActivatedRoute,
    private router: Router,
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
      description: ['', [Validators.required, Validators.maxLength(500)]],
      category: ['', [Validators.maxLength(40)]],
      tags: ['', [Validators.maxLength(120)]],
      imageUrl: ['', [Validators.maxLength(500)]],
    });
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) return;

    const id = Number(idParam);
    if (Number.isNaN(id) || id <= 0) {
      this.formError.set('Invalid club id.');
      return;
    }

    this.editClubId = id;
    this.isEditMode.set(true);
    this.initializing.set(true);

    this.clubs.getClub(id).subscribe({
      next: (res) => {
        this.form.patchValue({
          name: res.club.name ?? '',
          description: res.club.description ?? '',
          category: '',
          tags: '',
          imageUrl: '',
        });
        this.initializing.set(false);
      },
      error: () => {
        this.formError.set('Could not load club details.');
        this.initializing.set(false);
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const token = this.auth.getToken();
    if (!token) {
      this.router.navigate(['/auth/login']);
      return;
    }

    this.loading.set(true);
    this.formError.set('');
    this.fieldErrors.set({});

    const payload: ClubRequest = {
      name: (this.form.value.name ?? '').trim(),
      description: (this.form.value.description ?? '').trim(),
      category: (this.form.value.category ?? '').trim(),
      tags: (this.form.value.tags ?? '').trim(),
      imageUrl: (this.form.value.imageUrl ?? '').trim(),
    };

    const request$ = this.isEditMode() && this.editClubId
      ? this.clubs.updateClub(this.editClubId, payload, token)
      : this.clubs.createClub(payload, token);

    request$.subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/feed']);
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.applyBackendErrors(error);
      },
    });
  }

  private applyBackendErrors(error: HttpErrorResponse): void {
    const message =
      typeof error.error === 'string' && error.error.trim().length > 0
        ? error.error.trim()
        : 'Failed to save club. Please try again.';

    const lowerMessage = message.toLowerCase();
    const nextFieldErrors: Record<string, string> = {};

    if (lowerMessage.includes('name')) {
      nextFieldErrors['name'] = message;
    } else if (lowerMessage.includes('description')) {
      nextFieldErrors['description'] = message;
    } else {
      this.formError.set(message);
    }

    this.fieldErrors.set(nextFieldErrors);
  }
}
