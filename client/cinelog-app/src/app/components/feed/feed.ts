import { Component, inject, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TmdbService, Movie } from '../../services/tmdb';
import { ReviewModalComponent } from '../review-modal/review-modal';
import { WatchlistService } from '../../services/watchlist';
import { ListService } from '../../services/list';
import { Subject, takeUntil } from 'rxjs';
import { CreateReviewRequest } from '../../services/review';
import { ReviewService } from '../../services/review';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [CommonModule, ReviewModalComponent],
  template: `
    <div class="min-h-screen bg-gray-900 overflow-hidden">
      <!-- Navigation Header -->
      <nav class="bg-gray-800 border-b border-gray-700 fixed top-0 w-full z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center h-16">
            <h1 class="text-2xl font-bold text-white cursor-pointer" (click)="goHome()">🎬 CineLog</h1>
            <button
              (click)="goHome()"
              class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </nav>

      <!-- Feed Container (Full Screen Reels Style) -->
      <div class="pt-16 h-screen overflow-y-scroll snap-y snap-mandatory scrollbar-hide" id="feed-scroll">
        <!-- Loading Message -->
        <div *ngIf="isLoading && movies.length === 0" class="h-screen flex justify-center items-center snap-start">
          <div class="text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p class="text-gray-400">Loading movies...</p>
          </div>
        </div>

        <!-- Error Message -->
        <div *ngIf="!isLoading && movies.length === 0" class="h-screen flex justify-center items-center snap-start">
          <div class="text-center">
            <p class="text-red-400 text-lg mb-4">Failed to load movies. Please check the console for details.</p>
            <button
              (click)="loadMovies()"
              class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition"
            >
              Retry
            </button>
          </div>
        </div>

        <!-- Movie Reels -->
        <div *ngFor="let movie of movies; let i = index" 
             class="h-screen w-full snap-start relative"
             [attr.data-index]="i">
          <!-- Background Image -->
          <div class="absolute inset-0 bg-cover bg-center"
               [style.backgroundImage]="'url(' + getBackdropUrl(movie) + ')'">
            <!-- Dark Overlay -->
            <div class="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80"></div>
          </div>

          <!-- Content -->
          <div class="relative h-full flex flex-col justify-between p-6 text-white">
            <!-- Movie Info -->
            <div class="mt-auto space-y-4">
              <!-- Title -->
              <h2 class="text-4xl font-bold drop-shadow-lg">{{ movie.title }}</h2>

              <!-- Rating & Year -->
              <div class="flex items-center gap-4">
                <div class="flex items-center gap-2 bg-yellow-500 text-black px-3 py-1 rounded-full font-bold">
                  <span>⭐</span>
                  <span>{{ (movie.vote_average / 2).toFixed(1) }}/5</span>
                </div>
                <span class="text-lg">{{ movie.release_date?.substring(0, 4) }}</span>
              </div>

              <!-- Overview/Description -->
              <p class="text-lg leading-relaxed max-w-3xl line-clamp-4 drop-shadow-lg">
                {{ movie.overview || 'No description available.' }}
              </p>

              <!-- Action Buttons -->
              <div class="flex gap-3 pt-4">
                <button
                  (click)="addToWatchlist(movie)"
                  class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition shadow-lg"
                >
                  📚 Add to Watchlist
                </button>
                <button
                  (click)="openLogModal(movie)"
                  class="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition shadow-lg"
                >
                  📝 Log Movie
                </button>
                <button
                  (click)="viewMovieDetails(movie)"
                  class="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition shadow-lg"
                >
                  👁️ View
                </button>
              </div>
            </div>
          </div>

          <!-- Scroll Indicator -->
          <div *ngIf="i === 0" class="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-white text-sm animate-bounce">
            <p>⬇️ Scroll for more</p>
          </div>
        </div>

        <!-- Loading More Indicator -->
        <div *ngIf="isLoadingMore" class="h-screen flex justify-center items-center snap-start">
          <div class="text-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
            <p class="text-gray-400 text-sm">Loading more movies...</p>
          </div>
        </div>
      </div>

      <!-- Review Modal -->
      <app-review-modal
        *ngIf="selectedMovie"
        [isOpen]="showReviewModal"
        [movieTitle]="selectedMovie.title"
        [tmdbId]="selectedMovie.id"
        [posterPath]="selectedMovie.poster_path || ''"
        (submitted)="onReviewSubmitted($event)"
        (addedToWatchlist)="onMovieAddedToWatchlist($event)"
        (addedToList)="onMovieAddedToList($event)"
        (cancelled)="onReviewCancelled()"
      ></app-review-modal>
    </div>
  `,
  styles: `
    :host ::ng-deep .scrollbar-hide {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    :host ::ng-deep .scrollbar-hide::-webkit-scrollbar {
      display: none;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeedComponent implements OnInit, OnDestroy {
  private tmdbService = inject(TmdbService);
  private watchlistService = inject(WatchlistService);
  private listService = inject(ListService);
  private reviewService = inject(ReviewService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  movies: Movie[] = [];
  isLoading = false;
  isLoadingMore = false;
  currentPage = 1;
  selectedMovie: Movie | null = null;
  showReviewModal = false;

  ngOnInit(): void {
    this.loadMovies();
    setTimeout(() => this.setupScrollListener(), 100);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupScrollListener(): void {
    const scrollContainer = document.getElementById('feed-scroll');
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', () => {
        const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
        if (scrollTop + clientHeight >= scrollHeight - 1000 && !this.isLoadingMore) {
          this.loadMore();
        }
      });
    }
  }

  loadMovies(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    console.log('🎬 FEED COMPONENT: Loading movies from TMDB API...');
    
    // Get popular movies (page 1 for testing)
    this.tmdbService.getTrendingMovies('week', 1).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        console.log('✅ Movies loaded successfully from TMDB:', response);
        this.movies = response.results;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('❌ Error loading movies from TMDB:', err);
        console.error('Error details:', err.message, err.error);
        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  loadMore(): void {
    if (this.isLoadingMore) return;
    
    this.isLoadingMore = true;
    this.currentPage++;
    this.cdr.markForCheck();

    const randomPage = Math.floor(Math.random() * 10) + 1;
    this.tmdbService.getTrendingMovies('week', randomPage).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.movies = [...this.movies, ...response.results];
        this.isLoadingMore = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading more movies:', err);
        this.isLoadingMore = false;
        this.cdr.markForCheck();
      },
    });
  }

  getBackdropUrl(movie: Movie): string {
    return this.tmdbService.getBackdropUrl(movie.backdrop_path, 'original');
  }

  addToWatchlist(movie: Movie): void {
    this.watchlistService.addToWatchlist(
      movie.id,
      movie.title,
      movie.poster_path || ''
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error adding to watchlist:', err);
      },
    });
  }

  openLogModal(movie: Movie): void {
    this.selectedMovie = movie;
    this.showReviewModal = true;
    this.cdr.markForCheck();
  }

  onReviewSubmitted(review: CreateReviewRequest): void {
    this.reviewService.createReview(review).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.showReviewModal = false;
        this.selectedMovie = null;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error submitting review:', err);
        this.cdr.markForCheck();
      },
    });
  }

  onMovieAddedToWatchlist(tmdbId: number): void {
    const movie = this.movies.find(m => m.id === tmdbId);
    if (movie) {
      this.addToWatchlist(movie);
    }
  }

  onMovieAddedToList(event: { listId: string; tmdbId: number }): void {
    const movie = this.movies.find(m => m.id === event.tmdbId);
    if (!movie) return;

    this.listService.addMovieToList(event.listId, {
      tmdbId: event.tmdbId,
      movieTitle: movie.title,
      posterPath: movie.poster_path || undefined,
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error adding to list:', err);
      },
    });
  }

  onReviewCancelled(): void {
    this.showReviewModal = false;
    this.selectedMovie = null;
    this.cdr.markForCheck();
  }

  viewMovieDetails(movie: Movie): void {
    this.router.navigate(['/movie', movie.id]);
  }

  goHome(): void {
    this.router.navigate(['/home']);
  }
}
