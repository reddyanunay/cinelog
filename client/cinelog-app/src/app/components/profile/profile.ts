import { Component, inject, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { ReviewService, Review } from '../../services/review';
import { ListService } from '../../services/list';
import { ToastService } from '../../services/toast.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gray-900">
      <!-- Navigation Header -->
      <nav class="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center h-16">
            <h1 class="text-2xl font-bold text-white">🎬 CineLog</h1>
            <button
              (click)="goHome()"
              class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </nav>

      <!-- Main Content -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Profile Header -->
        <div class="bg-gray-800 rounded-lg p-6 mb-8">
          <div *ngIf="currentUser$ | async as user">
            <h2 class="text-3xl font-bold text-white mb-2">{{ user.username }}'s Profile</h2>
            <p class="text-gray-400">{{ user.email }}</p>
            <div class="flex gap-6 mt-4">
              <p class="text-gray-400">📽️ Movies Logged: <span class="text-white font-semibold">{{ totalReviews }}</span></p>
              <button 
                (click)="viewWatchlist()"
                class="text-gray-400 hover:text-white transition cursor-pointer"
              >
                📚 Watchlist: <span class="text-white font-semibold">{{ watchlistCount }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Logged Movies Section -->
        <div>
          <h3 class="text-2xl font-bold text-white mb-6">My Logged Movies</h3>

          <!-- Loading State -->
          <div *ngIf="isLoading" class="flex justify-center py-12">
            <div class="text-center">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p class="text-gray-400">Loading movies...</p>
            </div>
          </div>

          <!-- Reviews List -->
          <div *ngIf="!isLoading && reviews.length > 0" class="space-y-4">
            <div
              *ngFor="let review of reviews"
              class="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-blue-500 transition"
            >
              <div class="flex gap-4">
                <!-- Movie Poster -->
                <img
                  *ngIf="review.posterPath"
                  [src]="getPosterUrl(review.posterPath)"
                  [alt]="review.movieTitle"
                  class="w-20 h-32 object-cover rounded"
                />

                <!-- Review Details -->
                <div class="flex-1">
                  <h4 class="text-xl font-bold text-white mb-2">{{ review.movieTitle }}</h4>

                  <!-- Rating -->
                  <div class="flex items-center gap-2 mb-2">
                    <span class="text-yellow-400">⭐</span>
                    <span class="text-white font-semibold">{{ review.rating }}/5</span>
                  </div>

                  <!-- Watched Date -->
                  <p class="text-gray-400 text-sm mb-2">
                    Watched: {{ review.watchedDate | date: 'MMM dd, yyyy' }}
                  </p>

                  <!-- Review Text -->
                  <p *ngIf="review.content" class="text-gray-300 text-sm line-clamp-2">{{ review.content }}</p>

                  <!-- Review Date -->
                  <p class="text-gray-500 text-xs mt-2">Logged: {{ review.createdAt | date: 'MMM dd, yyyy' }}</p>
                </div>

                <!-- Delete Button -->
                <button
                  (click)="deleteReview(review._id!)"
                  class="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded h-fit transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>

          <!-- Pagination -->
          <div *ngIf="!isLoading && reviews.length > 0 && totalPages > 1" class="flex justify-center gap-2 mt-8">
            <button
              (click)="previousPage()"
              [disabled]="currentPage === 1"
              class="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded transition"
            >
              ← Previous
            </button>
            <div class="bg-gray-800 rounded px-4 py-2 text-white">
              Page {{ currentPage }} of {{ totalPages }}
            </div>
            <button
              (click)="nextPage()"
              [disabled]="currentPage === totalPages"
              class="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded transition"
            >
              Next →
            </button>
          </div>

          <!-- No Reviews -->
          <div *ngIf="!isLoading && reviews.length === 0" class="text-center py-12">
            <p class="text-gray-400 text-lg">No movies logged yet.</p>
            <button
              (click)="goHome()"
              class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition mt-4"
            >
              Start Logging Movies
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent implements OnInit, OnDestroy {
  private reviewService = inject(ReviewService);
  private authService = inject(AuthService);
  private listService = inject(ListService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  currentUser$ = this.authService.currentUser$;
  reviews: Review[] = [];
  watchlistCount = 0;
  isLoading = false;
  currentPage = 1;
  totalPages = 1;
  totalReviews = 0;

  ngOnInit(): void {
    this.loadReviews();
    this.loadWatchlistCount();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadReviews(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    this.reviewService.getUserReviews(this.currentPage).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: any) => {
        this.reviews = response.data || [];
        if (response.pagination) {
          this.totalPages = response.pagination.pages;
          this.totalReviews = response.pagination.total;
        }
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading reviews:', err);
        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  deleteReview(reviewId: string): void {
    if (!confirm('Are you sure you want to delete this review?')) return;

    this.reviewService.deleteReview(reviewId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.reviews = this.reviews.filter(r => r._id !== reviewId);
        this.totalReviews--;
        this.toastService.success('Review deleted successfully');
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error deleting review:', err);
        this.toastService.error('Failed to delete review');
      },
    });
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadReviews();
      window.scrollTo(0, 0);
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadReviews();
      window.scrollTo(0, 0);
    }
  }

  loadWatchlistCount(): void {
    this.listService.getUserLists().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: any) => {
        const watchlist = response.data?.find((list: any) => list.name === 'Watchlist');
        this.watchlistCount = watchlist ? watchlist.movies.length : 0;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading watchlist:', err);
        this.watchlistCount = 0;
      }
    });
  }

  viewWatchlist(): void {
    this.router.navigate(['/lists']);
  }

  getPosterUrl(posterPath: string): string {
    return `https://image.tmdb.org/t/p/w154${posterPath}`;
  }

  goHome(): void {
    this.router.navigate(['/home']);
  }
}
