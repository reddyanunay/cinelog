import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
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

        <!-- Login Card -->
        <div class="bg-gray-800 rounded-lg shadow-2xl p-8">
          <h2 class="text-2xl font-bold text-white mb-6 text-center">Sign In</h2>

          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-4">
            <!-- Email Field -->
            <div>
              <label class="block text-gray-300 text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                formControlName="email"
                placeholder="Enter your email"
                class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <p *ngIf="loginForm.get('email')?.invalid && loginForm.get('email')?.touched" class="text-red-500 text-xs mt-1">
                Please enter a valid email
              </p>
            </div>

            <!-- Password Field -->
            <div>
              <label class="block text-gray-300 text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                formControlName="password"
                placeholder="Enter your password"
                class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <p *ngIf="loginForm.get('password')?.invalid && loginForm.get('password')?.touched" class="text-red-500 text-xs mt-1">
                Password is required
              </p>
            </div>

            <!-- Error Message -->
            <div *ngIf="errorMessage" class="bg-red-500 bg-opacity-20 border border-red-500 text-red-300 px-4 py-2 rounded-lg text-sm">
              {{ errorMessage }}
            </div>

            <!-- Submit Button -->
            <button
              type="submit"
              [disabled]="loginForm.invalid || isLoading"
              class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition duration-200 mt-6"
            >
              {{ isLoading ? 'Signing in...' : 'Sign In' }}
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

          <!-- Register Link -->
          <p class="text-center text-gray-400 text-sm">
            Don't have an account?
            <button
              type="button"
              (click)="goToRegister()"
              class="text-blue-500 hover:text-blue-400 font-semibold"
            >
              Sign Up
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
export class Login {
  private authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';

    const credentials = this.loginForm.value;
    this.authService.login(credentials).subscribe({
      next: (response) => {
        if (response.success) {
          this.router.navigate(['/home']);
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Login failed. Please try again.';
      },
    });
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }
}
