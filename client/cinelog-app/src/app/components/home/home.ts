import { Component, inject, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TmdbService, Movie } from '../../services/tmdb';
import { AuthService } from '../../services/auth';
import { ReviewService, Review, CreateReviewRequest } from '../../services/review';
import { WatchlistService } from '../../services/watchlist';
import { ListService } from '../../services/list';
import { ToastService } from '../../services/toast.service';
import { MovieCard } from '../movie-card/movie-card';
import { ReviewModalComponent } from '../review-modal/review-modal';
import { SanitizeUrlPipe } from '../../pipes/sanitize-url.pipe';
import { debounceTime, Subject, takeUntil, forkJoin } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, MovieCard, ReviewModalComponent, SanitizeUrlPipe],
  templateUrl: './home.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home implements OnInit, OnDestroy {
  private tmdbService = inject(TmdbService);
  private authService = inject(AuthService);
  private reviewService = inject(ReviewService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  trendingMovies: Movie[] = [];
  searchResults: Movie[] = [];
  discoverMovies: Movie[] = [];
  feedReviews: Review[] = [];
  feedMovies: Movie[] = []; // Feed-specific movies for Reels view
  feedMoviesWithVideos: Map<number, string | null> = new Map(); // Store YouTube keys for trailers
  moviesInWatchlist: Set<number> = new Set(); // Track which movies are in watchlist
  feedPage = 1;
  isLoadingMore = false;
  currentUser$ = this.authService.currentUser$;
  isLoading = false;
  searchQuery = '';
  activeTab: 'trending' | 'search' | 'discover' | 'feed' = 'trending';
  errorMessage = '';
  
  // Pagination
  currentTrendingPage = 1;
  trendingTotalPages = 1;
  currentSearchPage = 1;
  searchTotalPages = 1;
  currentDiscoverPage = 1;
  discoverTotalPages = 1;
  
  // Discover filters
  selectedGenre = '';
  selectedYear = '';
  selectedRating = '';
  selectedSort = 'popularity.desc';
  genres: { id: number; name: string }[] = [
    { id: 28, name: 'Action' },
    { id: 12, name: 'Adventure' },
    { id: 16, name: 'Animation' },
    { id: 35, name: 'Comedy' },
    { id: 80, name: 'Crime' },
    { id: 99, name: 'Documentary' },
    { id: 18, name: 'Drama' },
    { id: 10751, name: 'Family' },
    { id: 14, name: 'Fantasy' },
    { id: 36, name: 'History' },
    { id: 27, name: 'Horror' },
    { id: 10402, name: 'Music' },
    { id: 9648, name: 'Mystery' },
    { id: 10749, name: 'Romance' },
    { id: 878, name: 'Sci-Fi' },
    { id: 10770, name: 'TV Movie' },
    { id: 53, name: 'Thriller' },
    { id: 10752, name: 'War' },
    { id: 37, name: 'Western' },
  ];
  years = Array.from({ length: 25 }, (_, i) => new Date().getFullYear() - i);
  ratings = [
    { value: '5', label: '5.0+' },
    { value: '6', label: '6.0+' },
    { value: '7', label: '7.0+' },
    { value: '8', label: '8.0+' },
    { value: '9', label: '9.0+' },
  ];

  // Review Modal
  showReviewModal = false;
  selectedMovieForReview: Movie | null = null;
  userLists: any[] = [];

  private watchlistService = inject(WatchlistService);
  private listService = inject(ListService);

  ngOnInit(): void {
    this.loadTrendingMovies();
    
    // Setup real-time search with debounce
    this.searchSubject.pipe(
      debounceTime(500),
      takeUntil(this.destroy$)
    ).subscribe((query) => {
      if (query.trim()) {
        this.performSearch(query);
      } else {
        this.searchResults = [];
        this.activeTab = 'trending';
        this.cdr.markForCheck();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setActiveTab(tab: 'trending' | 'search' | 'discover' | 'feed'): void {
    this.activeTab = tab;
    this.cdr.markForCheck();
    
    if (tab === 'discover' && this.discoverMovies.length === 0) {
      this.loadDiscoverMovies();
    }
    if (tab === 'feed') {
      if (this.feedMovies.length === 0) {
        this.loadFeed();
      }
      this.loadWatchlistMovies();
    }
  }

  private loadWatchlistMovies(): void {
    // Load watchlist to check which movies are already added
    this.listService.getUserLists().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: any) => {
        const watchlist = response.data?.find((list: any) => list.name === 'Watchlist');
        if (watchlist && watchlist.movies) {
          this.moviesInWatchlist = new Set(watchlist.movies.map((m: any) => m.tmdbId));
          this.cdr.markForCheck();
        }
      },
      error: (err) => {
        console.error('Error loading watchlist:', err);
      }
    });
  }

  isInWatchlist(movieId: number): boolean {
    return this.moviesInWatchlist.has(movieId);
  }

  loadTrendingMovies(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    this.tmdbService.getTrendingMovies('week', this.currentTrendingPage).subscribe({
      next: (response) => {
        this.trendingMovies = response.results;
        this.trendingTotalPages = response.total_pages;
        this.isLoading = false;
        this.activeTab = 'trending';
        this.cdr.markForCheck();
        window.scrollTo(0, 0);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'Failed to load trending movies. Please check your API key.';
        console.error('Error loading trending movies:', err);
        this.cdr.markForCheck();
      },
    });
  }

  loadDiscoverMovies(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    const filterParams: any = {
      page: this.currentDiscoverPage,
      sort_by: this.selectedSort,
    };

    if (this.selectedGenre) filterParams.with_genres = this.selectedGenre;
    if (this.selectedYear) filterParams.primary_release_year = this.selectedYear;
    if (this.selectedRating) filterParams['vote_average.gte'] = this.selectedRating;

    this.tmdbService.getDiscoverMovies(filterParams).subscribe({
      next: (response) => {
        this.discoverMovies = response.results;
        this.discoverTotalPages = response.total_pages;
        this.isLoading = false;
        this.cdr.markForCheck();
        window.scrollTo(0, 0);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'Failed to load discover movies.';
        console.error('Error loading discover movies:', err);
        this.cdr.markForCheck();
      },
    });
  }

  loadFeed(): void {
    console.log('🎬 HOME COMPONENT: Loading feed from TMDB API...');
    this.isLoading = true;
    this.errorMessage = '';
    this.feedPage = 1;
    this.feedMoviesWithVideos.clear();
    this.cdr.markForCheck();

    this.tmdbService.getTrendingMovies('week', this.feedPage).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        console.log('✅ Feed movies loaded successfully from TMDB:', response);
        this.feedMovies = response.results;
        this.loadTrailersForMovies(response.results);
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('❌ Error loading feed:', err);
        this.isLoading = false;
        this.errorMessage = 'Failed to load feed.';
        this.cdr.markForCheck();
      },
    });
  }

  private loadTrailersForMovies(movies: Movie[]): void {
    // Load trailers for each movie (limit to first 10 to avoid too many requests)
    movies.slice(0, 10).forEach(movie => {
      this.tmdbService.getMovieVideos(movie.id).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (response) => {
          // Find official trailer or first YouTube video
          const trailer = response.results.find(
            v => v.type === 'Trailer' && v.site === 'YouTube' && v.official
          ) || response.results.find(
            v => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
          );
          
          this.feedMoviesWithVideos.set(movie.id, trailer ? trailer.key : null);
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error(`Error loading trailer for ${movie.title}:`, err);
          this.feedMoviesWithVideos.set(movie.id, null);
        }
      });
    });
  }

  loadMoreFeedMovies(): void {
    if (this.isLoadingMore) return;
    
    this.feedPage++;
    this.isLoadingMore = true;
    this.cdr.markForCheck();

    this.tmdbService.getTrendingMovies('week', this.feedPage).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        const newMovies = response.results;
        this.feedMovies = [...this.feedMovies, ...newMovies];
        this.loadTrailersForMovies(newMovies);
        this.isLoadingMore = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading more feed:', err);
        this.isLoadingMore = false;
        this.feedPage--;
        this.cdr.markForCheck();
      },
    });
  }

  getMovieTrailer(movieId: number): string | null {
    return this.feedMoviesWithVideos.get(movieId) || null;
  }

  getYouTubeEmbedUrl(key: string): string {
    return `https://www.youtube.com/embed/${key}?autoplay=0&controls=1&rel=0`;
  }

  onFeedScroll(event: Event): void {
    const element = event.target as HTMLElement;
    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight;
    const clientHeight = element.clientHeight;

    // Load more when user scrolls near bottom (within 1000px)
    if (scrollHeight - scrollTop - clientHeight < 1000 && !this.isLoadingMore) {
      this.loadMoreFeedMovies();
    }
  }

  getBackdropUrl(movie: Movie): string {
    return movie.backdrop_path
      ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
      : movie.poster_path
      ? `https://image.tmdb.org/t/p/original${movie.poster_path}`
      : 'https://via.placeholder.com/1920x1080?text=No+Image';
  }

  addMovieToWatchlist(movie: Movie): void {
    console.log('🎬 Adding to watchlist:', movie.title);
    // Watchlist is now a special list named "Watchlist"
    this.listService.getUserLists().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: any) => {
        console.log('📋 User lists response:', response);
        const watchlist = response.data?.find((list: any) => list.name === 'Watchlist');
        
        if (watchlist) {
          console.log('✅ Found existing watchlist:', watchlist._id);
          // Add to existing watchlist
          this.addToExistingList(watchlist._id, movie);
        } else {
          console.log('➕ Creating new watchlist');
          // Create watchlist first, then add movie
          this.createWatchlistAndAddMovie(movie);
        }
      },
      error: (err) => {
        console.error('❌ Error checking watchlist:', err);
        this.toastService.error('Failed to add to watchlist');
      }
    });
  }

  private createWatchlistAndAddMovie(movie: Movie): void {
    this.listService.createList('Watchlist', 'Your default watchlist', false).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: any) => {
        console.log('✅ Watchlist created:', response);
        const listId = response.list._id;
        this.addToExistingList(listId, movie);
      },
      error: (err) => {
        console.error('❌ Error creating watchlist:', err);
        this.toastService.error('Failed to create watchlist');
      }
    });
  }

  private addToExistingList(listId: string, movie: Movie): void {
    console.log('➕ Adding movie to list:', listId, movie.title);
    this.listService.addMovieToList(listId, movie.id, movie.title, movie.poster_path || '').pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        console.log(`✅ ${movie.title} added to Watchlist!`, response);
        this.moviesInWatchlist.add(movie.id);
        this.toastService.success(`"${movie.title}" added to Watchlist!`);
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('❌ Error adding to list:', err);
        if (err.error?.message?.includes('already in this list')) {
          this.moviesInWatchlist.add(movie.id);
          this.toastService.info(`"${movie.title}" is already in your watchlist`);
          this.cdr.markForCheck();
        } else {
          this.toastService.error('Failed to add to watchlist');
        }
      }
    });
  }

  onDiscoverFilterChange(): void {
    this.currentDiscoverPage = 1;
    this.loadDiscoverMovies();
  }

  onSearchInput(value: string): void {
    this.searchQuery = value;
    this.searchSubject.next(value);
  }

  performSearch(query: string): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.currentSearchPage = 1;
    this.cdr.markForCheck();

    this.tmdbService.searchMovies(query, this.currentSearchPage).subscribe({
      next: (response) => {
        this.searchResults = response.results;
        this.searchTotalPages = response.total_pages;
        this.activeTab = 'search';
        this.isLoading = false;

        if (this.searchResults.length === 0) {
          this.errorMessage = 'No movies found. Try a different search.';
        }
        this.cdr.markForCheck();
        window.scrollTo(0, 0);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'Search failed. Please try again.';
        console.error('Error searching movies:', err);
        this.cdr.markForCheck();
      },
    });
  }

  searchMovies(): void {
    if (!this.searchQuery.trim()) {
      this.errorMessage = 'Please enter a movie title';
      this.cdr.markForCheck();
      return;
    }
    this.performSearch(this.searchQuery);
  }

  onViewDetails(movie: Movie): void {
    this.router.navigate(['/movie', movie.id]);
  }

  onLogMovie(movie: Movie): void {
    this.selectedMovieForReview = movie;
    this.showReviewModal = true;
    this.cdr.markForCheck();
  }

  onReviewSubmitted(review: CreateReviewRequest): void {
    if (!this.selectedMovieForReview) return;

    this.reviewService.createReview(review).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.showReviewModal = false;
        this.toastService.success(`"${this.selectedMovieForReview?.title}" logged successfully!`);
        this.selectedMovieForReview = null;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error submitting review:', err);
        this.toastService.error('Failed to log movie');
      },
    });
  }

  onMovieAddedToWatchlist(tmdbId: number): void {
    if (!this.selectedMovieForReview) return;

    // Watchlist is now a special list - find or create it
    this.listService.getUserLists().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: any) => {
        const watchlist = response.data.find((list: any) => list.name === 'Watchlist');
        
        if (watchlist) {
          this.addMovieToWatchlistList(watchlist._id);
        } else {
          this.createWatchlistForModal();
        }
      },
      error: (err) => {
        console.error('Error checking watchlist:', err);
        this.toastService.error('Failed to add to watchlist');
      }
    });
  }

  private createWatchlistForModal(): void {
    if (!this.selectedMovieForReview) return;
    
    this.listService.createList('Watchlist', 'Your default watchlist', false).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: any) => {
        const listId = response.list._id;
        this.addMovieToWatchlistList(listId);
      },
      error: (err) => {
        console.error('Error creating watchlist:', err);
        this.toastService.error('Failed to create watchlist');
      }
    });
  }

  private addMovieToWatchlistList(listId: string): void {
    if (!this.selectedMovieForReview) return;
    
    this.listService.addMovieToList(
      listId, 
      this.selectedMovieForReview.id, 
      this.selectedMovieForReview.title, 
      this.selectedMovieForReview.poster_path || ''
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        console.log(`✅ ${this.selectedMovieForReview?.title} added to Watchlist!`);
        this.toastService.success(`"${this.selectedMovieForReview?.title}" added to Watchlist!`);
        // Don't close modal - user can continue with other actions
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error adding to watchlist:', err);
        if (err.error?.message?.includes('already in this list')) {
          this.toastService.info(`"${this.selectedMovieForReview?.title}" is already in your watchlist`);
        } else {
          this.toastService.error('Failed to add to watchlist');
        }
      }
    });
  }

  onMovieAddedToList(event: { listId: string; tmdbId: number }): void {
    if (!this.selectedMovieForReview) return;

    this.listService.addMovieToList(
      event.listId,
      event.tmdbId,
      this.selectedMovieForReview.title,
      this.selectedMovieForReview.poster_path || ''
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        console.log(`✅ ${this.selectedMovieForReview?.title} added to list!`);
        this.toastService.success(`"${this.selectedMovieForReview?.title}" added to list!`);
        // Don't close modal - user can continue with other actions
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error adding to list:', err);
        if (err.error?.message?.includes('already in this list')) {
          this.toastService.info(`"${this.selectedMovieForReview?.title}" is already in this list`);
        } else {
          this.toastService.error('Failed to add to list');
        }
      },
    });
  }

  onReviewCancelled(): void {
    this.showReviewModal = false;
    this.selectedMovieForReview = null;
    this.cdr.markForCheck();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  goToProfile(): void {
    this.router.navigate(['/profile']);
  }

  goToLists(): void {
    this.router.navigate(['/lists']);
  }

  nextPage(): void {
    if (this.activeTab === 'trending' && this.currentTrendingPage < this.trendingTotalPages) {
      this.currentTrendingPage++;
      this.loadTrendingMovies();
    } else if (this.activeTab === 'search' && this.currentSearchPage < this.searchTotalPages) {
      this.currentSearchPage++;
      this.performSearch(this.searchQuery);
    } else if (this.activeTab === 'discover' && this.currentDiscoverPage < this.discoverTotalPages) {
      this.currentDiscoverPage++;
      this.loadDiscoverMovies();
    }
  }

  previousPage(): void {
    if (this.activeTab === 'trending' && this.currentTrendingPage > 1) {
      this.currentTrendingPage--;
      this.loadTrendingMovies();
    } else if (this.activeTab === 'search' && this.currentSearchPage > 1) {
      this.currentSearchPage--;
      this.performSearch(this.searchQuery);
    } else if (this.activeTab === 'discover' && this.currentDiscoverPage > 1) {
      this.currentDiscoverPage--;
      this.loadDiscoverMovies();
    }
  }

  goToPage(pageNumber: number): void {
    if (this.activeTab === 'trending') {
      this.currentTrendingPage = pageNumber;
      this.loadTrendingMovies();
    } else if (this.activeTab === 'search') {
      this.currentSearchPage = pageNumber;
      this.performSearch(this.searchQuery);
    } else if (this.activeTab === 'discover') {
      this.currentDiscoverPage = pageNumber;
      this.loadDiscoverMovies();
    }
  }

  get currentPage(): number {
    if (this.activeTab === 'trending') return this.currentTrendingPage;
    if (this.activeTab === 'search') return this.currentSearchPage;
    if (this.activeTab === 'discover') return this.currentDiscoverPage;
    return 1;
  }

  get totalPages(): number {
    if (this.activeTab === 'trending') return this.trendingTotalPages;
    if (this.activeTab === 'search') return this.searchTotalPages;
    if (this.activeTab === 'discover') return this.discoverTotalPages;
    return 1;
  }

  get displayMovies(): Movie[] {
    if (this.activeTab === 'trending') return this.trendingMovies;
    if (this.activeTab === 'search') return this.searchResults;
    if (this.activeTab === 'discover') return this.discoverMovies;
    return [];
  }

  // Generate page numbers for pagination
  get pageNumbers(): number[] {
    const pages: number[] = [];
    const maxButtons = 5;
    const start = Math.max(1, this.currentPage - Math.floor(maxButtons / 2));
    const end = Math.min(this.totalPages, start + maxButtons - 1);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  trackByMovieId(index: number, movie: Movie): number {
    return movie.id;
  }

  getUserName(review: Review): string {
    return (review as any).user?.username || 'User';
  }

  viewReviewMovie(tmdbId: number): void {
    this.router.navigate(['/movie', tmdbId]);
  }
}

