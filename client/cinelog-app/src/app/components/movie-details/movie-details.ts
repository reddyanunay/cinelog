import { Component, inject, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TmdbService, MovieDetails, CastMember, CrewMember } from '../../services/tmdb';
import { ReviewService, CreateReviewRequest } from '../../services/review';
import { ReviewModalComponent } from '../review-modal/review-modal';
import { AuthService } from '../../services/auth';
import { WatchlistService } from '../../services/watchlist';
import { ListService } from '../../services/list';
import { ToastService } from '../../services/toast.service';
import { SanitizeUrlPipe } from '../../pipes/sanitize-url.pipe';
import { Subject, takeUntil, forkJoin, of } from 'rxjs';

@Component({
  selector: 'app-movie-details',
  standalone: true,
  imports: [CommonModule, ReviewModalComponent, SanitizeUrlPipe],
  templateUrl: './movie-details.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MovieDetailsComponent implements OnInit, OnDestroy {
  private tmdbService = inject(TmdbService);
  private reviewService = inject(ReviewService);
  private authService = inject(AuthService);
  private watchlistService = inject(WatchlistService);
  private listService = inject(ListService);
  private toastService = inject(ToastService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  movieDetails: MovieDetails | null = null;
  cast: CastMember[] = [];
  director: string = '';
  writers: string[] = [];
  trailerKey: string | null = null;
  isLoading = false;
  errorMessage = '';
  showReviewModal = false;
  currentUser$ = this.authService.currentUser$;

  ngOnInit(): void {
    this.route.params.pipe(
      takeUntil(this.destroy$)
    ).subscribe(params => {
      const movieId = params['id'];
      if (movieId) {
        this.loadMovieDetails(parseInt(movieId, 10));
      }
    });

    // Check if we should open the modal (navigating from Log Movie button)
    this.route.fragment.pipe(
      takeUntil(this.destroy$)
    ).subscribe(fragment => {
      if (fragment === 'log') {
        // Delay to allow movie details to load first
        setTimeout(() => {
          this.showReviewModal = true;
          this.cdr.markForCheck();
        }, 500);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadMovieDetails(movieId: number): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    // Fetch movie details, credits, and videos in parallel
    forkJoin({
      details: this.tmdbService.getMovieDetails(movieId),
      credits: this.tmdbService.getMovieCredits(movieId),
      videos: this.tmdbService.getMovieVideos(movieId)
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.movieDetails = response.details;
        
        // Extract cast (top 10)
        this.cast = response.credits.cast.slice(0, 10);
        
        // Extract director
        const director = response.credits.crew.find(c => c.job === 'Director');
        this.director = director ? director.name : '';
        
        // Extract writers
        const writers = response.credits.crew.filter(c => 
          c.job === 'Writer' || c.job === 'Screenplay' || c.job === 'Story'
        );
        this.writers = [...new Set(writers.map(w => w.name))].slice(0, 3);
        
        // Extract trailer
        const trailer = response.videos.results.find(
          v => v.type === 'Trailer' && v.site === 'YouTube' && v.official
        ) || response.videos.results.find(
          v => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
        );
        this.trailerKey = trailer ? trailer.key : null;
        
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'Failed to load movie details. Please try again.';
        console.error('Error loading movie details:', err);
        this.cdr.markForCheck();
      },
    });
  }

  getYouTubeEmbedUrl(key: string): string {
    return `https://www.youtube.com/embed/${key}?autoplay=0&controls=1&rel=0`;
  }

  getProfileImageUrl(path: string | null): string {
    return path 
      ? `https://image.tmdb.org/t/p/w185${path}`
      : 'https://via.placeholder.com/185x278?text=No+Image';
  }

  getPosterUrl(): string {
    return this.movieDetails?.poster_path
      ? this.tmdbService.getPosterUrl(this.movieDetails.poster_path, 'w500')
      : 'https://via.placeholder.com/342x513?text=No+Image';
  }

  getBackdropUrl(): string {
    return this.movieDetails?.backdrop_path
      ? this.tmdbService.getBackdropUrl(this.movieDetails.backdrop_path, 'w1280')
      : 'https://via.placeholder.com/1280x720?text=No+Backdrop';
  }

  onLogMovie(): void {
    if (!this.movieDetails) return;
    this.showReviewModal = true;
  }

  onReviewSubmitted(review: CreateReviewRequest): void {
    this.reviewService.createReview(review).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.showReviewModal = false;
        this.toastService.success(`"${this.movieDetails?.title}" logged successfully!`);
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error submitting review:', err);
        this.toastService.error('Failed to save log');
        this.cdr.markForCheck();
      },
    });
  }

  onMovieAddedToWatchlist(tmdbId: number): void {
    if (!this.movieDetails) return;

    // Watchlist is now a special list named "Watchlist"
    this.listService.getUserLists().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: any) => {
        const watchlist = response.data.find((list: any) => list.name === 'Watchlist');
        
        if (watchlist) {
          // Add to existing watchlist
          this.addToWatchlistList(watchlist._id);
        } else {
          // Create watchlist first, then add movie
          this.createWatchlistAndAddMovie();
        }
      },
      error: (err) => {
        console.error('Error checking watchlist:', err);
        this.toastService.error('Failed to add to watchlist');
      }
    });
  }

  private createWatchlistAndAddMovie(): void {
    if (!this.movieDetails) return;
    
    this.listService.createList('Watchlist', 'Your default watchlist', false).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: any) => {
        const listId = response.list._id;
        this.addToWatchlistList(listId);
      },
      error: (err) => {
        console.error('Error creating watchlist:', err);
        this.toastService.error('Failed to create watchlist');
      }
    });
  }

  private addToWatchlistList(listId: string): void {
    if (!this.movieDetails) return;
    
    this.listService.addMovieToList(listId, this.movieDetails.id, this.movieDetails.title, this.movieDetails.poster_path || '').pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        console.log(`✅ ${this.movieDetails?.title} added to Watchlist!`);
        this.toastService.success(`"${this.movieDetails?.title}" added to Watchlist!`);
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error adding to watchlist:', err);
        if (err.error?.message?.includes('already in this list')) {
          this.toastService.info(`"${this.movieDetails?.title}" is already in your watchlist`);
        } else {
          this.toastService.error('Failed to add to watchlist');
        }
        this.cdr.markForCheck();
      }
    });
  }

  onMovieAddedToList(event: { listId: string; tmdbId: number }): void {
    if (!this.movieDetails) return;

    this.listService.addMovieToList(event.listId, {
      tmdbId: event.tmdbId,
      movieTitle: this.movieDetails.title,
      posterPath: this.movieDetails.poster_path || undefined,
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.toastService.success(`"${this.movieDetails?.title}" added to list!`);
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error adding to list:', err);
        if (err.error?.message?.includes('already in this list')) {
          this.toastService.info(`"${this.movieDetails?.title}" is already in this list`);
        } else {
          this.toastService.error('Failed to add to list');
        }
      },
    });
  }

  onReviewCancelled(): void {
    this.showReviewModal = false;
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }
}
