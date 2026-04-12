import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../core/auth.service';
import {
    Profile as ProfileData,
    ProfileService,
} from '../core/profile.service';

@Component({
    selector: 'app-profile',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatSnackBarModule,
    ],
    templateUrl: './profile.html',
    styleUrl: './profile.css',
})
export class Profile implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly auth = inject(AuthService);
    private readonly profileService = inject(ProfileService);
    private readonly snackBar = inject(MatSnackBar);

    readonly loading = signal(true);
    readonly saving = signal(false);
    readonly loadError = signal('');
    readonly saveError = signal('');
    readonly isEditing = signal(false);
    readonly currentProfile = signal<ProfileData | null>(null);

    readonly form = this.fb.nonNullable.group({
        name: ['', [Validators.maxLength(120)]],
        bio: ['', [Validators.maxLength(500)]],
        interests: ['', [Validators.maxLength(300)]],
        availability: ['', [Validators.maxLength(300)]],
        skillLevel: ['', [Validators.maxLength(100)]],
    });

    readonly canSubmit = computed(() => !this.saving());
    readonly hasSavedProfile = computed(() => this.currentProfile() !== null);

    ngOnInit(): void {
        this.fetchProfile();
    }

    fetchProfile(): void {
        this.loading.set(true);
        this.loadError.set('');

        this.profileService.getProfile().subscribe({
            next: (profile) => {
                this.loading.set(false);
                const authName = this.auth.getCurrentUser()?.name?.trim() ?? '';

                if (!profile || this.isProfileEmpty(profile)) {
                    this.currentProfile.set(null);
                    this.isEditing.set(true);
                    this.form.reset({
                        name: authName,
                        bio: '',
                        interests: '',
                        availability: '',
                        skillLevel: '',
                    });
                    return;
                }

                const mergedProfile: ProfileData = {
                    ...profile,
                    name: (profile.name ?? '').trim() || authName,
                };
                this.currentProfile.set(mergedProfile);
                this.form.patchValue(mergedProfile);
                this.isEditing.set(false);
            },
            error: (error: HttpErrorResponse) => {
                this.loading.set(false);
                this.loadError.set(this.getErrorMessage(error, 'Could not load your profile. Please try again.'));
            },
        });
    }

    saveProfile(): void {
        if (!this.canSubmit()) {
            return;
        }

        this.saving.set(true);
        this.saveError.set('');

        const values = this.form.getRawValue();
        const nextName = values.name.trim();
        const payload = {
            bio: values.bio,
            interests: values.interests,
            availability: values.availability,
            skillLevel: values.skillLevel,
        };
        this.profileService.updateProfile(payload).subscribe({
            next: (savedProfile) => {
                this.saving.set(false);
                this.auth.updateCurrentUserName(nextName);
                const mergedProfile: ProfileData = {
                    ...savedProfile,
                    name: nextName,
                };
                this.currentProfile.set(mergedProfile);
                this.form.patchValue(mergedProfile);
                this.isEditing.set(false);
                this.snackBar.open('Profile saved successfully.', 'Close', {
                    duration: 2500,
                });
            },
            error: (error: HttpErrorResponse) => {
                this.saving.set(false);
                this.saveError.set(this.getErrorMessage(error, 'Failed to save profile. Please try again.'));
            },
        });
    }

    openEditForm(): void {
        this.isEditing.set(true);
        this.saveError.set('');
    }

    cancelEdit(): void {
        const profile = this.currentProfile();
        if (!profile) {
            return;
        }
        this.form.patchValue(profile);
        this.saveError.set('');
        this.isEditing.set(false);
    }

    displayValue(value: string, fallback: string): string {
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : fallback;
    }

    private isProfileEmpty(profile: ProfileData): boolean {
        return (
            profile.bio.trim().length === 0 &&
            profile.interests.trim().length === 0 &&
            profile.availability.trim().length === 0 &&
            profile.skillLevel.trim().length === 0
        );
    }

    private getErrorMessage(error: HttpErrorResponse, fallback: string): string {
        if (typeof error.error === 'string' && error.error.trim().length > 0) {
            return error.error.trim();
        }
        if (error.status === 401 || error.status === 403) {
            return 'Your session has expired. Please sign in again.';
        }
        if (error.status >= 500) {
            return 'Server error while saving profile. Please retry in a moment.';
        }
        return fallback;
    }
}
