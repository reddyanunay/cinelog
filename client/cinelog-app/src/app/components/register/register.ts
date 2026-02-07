import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center px-4">
      <div class="w-full max-w-md">
        <!-- Logo/Header -->
        <div class="text-center mb-8">
          <h1 class="text-4xl font-bold text-white mb-2">🎬 CineLog</h1>
          <p class="text-gray-400">Track every film you watch</p>
        </div>

        <!-- Register Card -->
        <div class="bg-gray-800 rounded-lg shadow-2xl p-8">
          <h2 class="text-2xl font-bold text-white mb-6 text-center">Create Account</h2>

          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="space-y-4">
            <!-- Username Field -->
            <div>
              <label class="block text-gray-300 text-sm font-medium mb-2">Username</label>
              <input
                type="text"
                formControlName="username"
                placeholder="Choose a username"
                class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <p *ngIf="registerForm.get('username')?.invalid && registerForm.get('username')?.touched" class="text-red-500 text-xs mt-1">
                Username must be at least 3 characters
              </p>
            </div>

            <!-- Email Field -->
            <div>
              <label class="block text-gray-300 text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                formControlName="email"
                placeholder="Enter your email"
                class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <p *ngIf="registerForm.get('email')?.invalid && registerForm.get('email')?.touched" class="text-red-500 text-xs mt-1">
                Please enter a valid email
              </p>
            </div>

            <!-- Password Field -->
            <div>
              <label class="block text-gray-300 text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                formControlName="password"
                placeholder="Create a password"
                class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <p *ngIf="registerForm.get('password')?.invalid && registerForm.get('password')?.touched" class="text-red-500 text-xs mt-1">
                Password must be at least 6 characters
              </p>
            </div>

            <!-- Confirm Password Field -->
            <div>
              <label class="block text-gray-300 text-sm font-medium mb-2">Confirm Password</label>
              <input
                type="password"
                formControlName="confirmPassword"
                placeholder="Confirm your password"
                class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <p *ngIf="registerForm.get('confirmPassword')?.invalid && registerForm.get('confirmPassword')?.touched" class="text-red-500 text-xs mt-1">
                Passwords do not match
              </p>
            </div>

            <!-- Error Message -->
            <div *ngIf="errorMessage" class="bg-red-500 bg-opacity-20 border border-red-500 text-red-300 px-4 py-2 rounded-lg text-sm">
              {{ errorMessage }}
            </div>

            <!-- Submit Button -->
            <button
              type="submit"
              [disabled]="registerForm.invalid || isLoading"
              class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition duration-200 mt-6"
            >
              {{ isLoading ? 'Creating Account...' : 'Create Account' }}
            </button>
          </form>

          <!-- Divider -->
          <div class="relative my-6">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-600"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-gray-800 text-gray-400">or</span>
            </div>
          </div>

          <!-- Login Link -->
          <p class="text-center text-gray-400 text-sm">
            Already have an account?
            <button
              type="button"
              (click)="goToLogin()"
              class="text-blue-500 hover:text-blue-400 font-semibold"
            >
              Sign In
            </button>
          </p>
        </div>

        <!-- Footer -->
        <p class="text-center text-gray-500 text-xs mt-8">
          © 2025 CineLog. Your personal movie database.
        </p>
      </div>
    </div>
  `,
  styles: ``,
})
export class Register {
  private authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  registerForm: FormGroup;
  isLoading = false;
  errorMessage = '';

  constructor() {
    this.registerForm = this.fb.group(
      {
        username: ['', [Validators.required, Validators.minLength(3)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required, Validators.minLength(6)]],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  passwordMatchValidator(group: AbstractControl): { [key: string]: boolean } | null {
    const password = group.get('password');
    const confirmPassword = group.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    if (confirmPassword?.hasError('passwordMismatch')) {
      confirmPassword.setErrors(null);
    }

    return null;
  }

  onSubmit(): void {
    if (this.registerForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';

    const formData = this.registerForm.value;
    this.authService.register(formData).subscribe({
      next: (response) => {
        if (response.success) {
          this.router.navigate(['/home']);
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Registration failed. Please try again.';
      },
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
