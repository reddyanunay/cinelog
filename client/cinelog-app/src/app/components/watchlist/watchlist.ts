import { Component, inject, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { WatchlistService, WatchlistItem } from '../../services/watchlist';
import { TmdbService } from '../../services/tmdb';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-watchlist',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gray-900">
      <!-- Navigation Header -->
      <nav class="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center h-16">
            <h1 class="text-2xl font-bold text-white cursor-pointer" (click)="goHome()">🎬 CineLog</h1>
            <button
              (click)="goBack()"
              class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition"
            >
              ← Back to Lists
            </button>
          </div>
        </div>
      </nav>

      <!-- Main Content -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Loading State -->
        <div *ngIf="isLoading" class="flex justify-center py-12">
          <div class="text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p class="text-gray-400">Loading watchlist...</p>
          </div>
        </div>

        <!-- Error State -->
        <div *ngIf="errorMessage && !isLoading" class="bg-red-500 bg-opacity-20 border border-red-500 text-red-300 px-6 py-4 rounded-lg mb-6">
          {{ errorMessage }}
        </div>

        <!-- Watchlist Details -->
        <div *ngIf="!isLoading" class="space-y-6">
          <!-- Header -->
          <div class="bg-gradient-to-r from-blue-900 to-blue-800 rounded-lg p-6 border-2 border-blue-600">
            <h1 class="text-4xl font-bold text-white mb-2">📚 My Watchlist</h1>
            <p class="text-blue-200 text-lg">Movies you want to watch</p>
            <div class="flex gap-4 mt-4">
              <span class="text-white">
                <span class="font-bold text-xl">{{ watchlistItems.length }}</span> movie{{ watchlistItems.length !== 1 ? 's' : '' }}
              </span>
            </div>
          </div>

          <!-- Movies Grid -->
          <div *ngIf="watchlistItems && watchlistItems.length > 0" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <div *ngFor="let movie of watchlistItems" class="group cursor-pointer" (click)="viewMovie(movie.tmdbId)">
              <div class="relative overflow-hidden rounded-lg shadow-lg bg-gray-800 h-full transition transform hover:scale-105">
                <!-- Movie Poster -->
                <img
                  [src]="getMoviePosterUrl(movie.posterPath)"
                  [alt]="movie.movieTitle"
                  class="w-full h-80 object-cover"
                />
                <!-- Overlay -->
                <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition flex items-end p-4">
                  <div class="text-white opacity-0 group-hover:opacity-100 transition w-full">
                    <p class="font-bold line-clamp-2">{{ movie.movieTitle }}</p>
                  </div>
                </div>
                <!-- Remove Button -->
                <button
                  (click)="removeFromWatchlist(movie.tmdbId, $event)"
                  class="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition"
                  title="Remove from watchlist"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>

          <!-- No Movies Message -->
          <div *ngIf="watchlistItems && watchlistItems.length === 0" class="text-center py-12">
            <p class="text-gray-400 text-lg mb-4">Your watchlist is empty. Start adding movies!</p>
            <button
              (click)="goHome()"
              class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition"
            >
              Discover Movies
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WatchlistComponent implements OnInit, OnDestroy {
  private watchlistService = inject(WatchlistService);
  private tmdbService = inject(TmdbService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  watchlistItems: WatchlistItem[] = [];
  isLoading = false;
  errorMessage = '';
  currentPage = 1;

  ngOnInit(): void {
    this.loadWatchlist();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadWatchlist(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    this.watchlistService.getWatchlist(this.currentPage).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.watchlistItems = response.data || [];
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading watchlist:', err);
        this.errorMessage = 'Failed to load watchlist. Please try again.';
        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  getMoviePosterUrl(posterPath: string): string {
    if (!posterPath) {
      return 'https://via.placeholder.com/342x513?text=No+Image';
    }
    return this.tmdbService.getPosterUrl(posterPath, 'w342');
  }

  viewMovie(tmdbId: number): void {
    this.router.navigate(['/movie', tmdbId]);
  }

  removeFromWatchlist(tmdbId: number, event: Event): void {
    event.stopPropagation();
    if (confirm('Remove from watchlist?')) {
      this.watchlistService.removeFromWatchlist(tmdbId).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: () => {
          this.loadWatchlist();
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error removing from watchlist:', err);
          this.errorMessage = 'Failed to remove from watchlist.';
          this.cdr.markForCheck();
        },
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/lists']);
  }

  goHome(): void {
    this.router.navigate(['/home']);
  }
}
