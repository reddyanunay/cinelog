import { Component, inject, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TmdbService, Movie } from '../../services/tmdb';
import { AuthService } from '../../services/auth';
import { MovieCard } from '../movie-card/movie-card';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-discover',
  standalone: true,
  imports: [CommonModule, FormsModule, MovieCard],
  template: `
    <div class="min-h-screen bg-gray-900">
      <!-- Navigation Header -->
      <nav class="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
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

      <!-- Main Content -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Filter Section -->
        <div class="bg-gray-800 rounded-lg p-6 mb-8">
          <h3 class="text-xl font-bold text-white mb-6">Filters</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <!-- Genre Filter -->
            <div>
              <label class="block text-gray-300 text-sm font-medium mb-2">Genre</label>
              <select
                [(ngModel)]="selectedGenre"
                (change)="applyFilters()"
                class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">All Genres</option>
                <option value="28">Action</option>
                <option value="12">Adventure</option>
                <option value="16">Animation</option>
                <option value="35">Comedy</option>
                <option value="80">Crime</option>
                <option value="99">Documentary</option>
                <option value="18">Drama</option>
                <option value="10751">Family</option>
                <option value="14">Fantasy</option>
                <option value="36">History</option>
                <option value="27">Horror</option>
                <option value="10749">Romance</option>
                <option value="878">Sci-Fi</option>
                <option value="10770">TV</option>
                <option value="53">Thriller</option>
              </select>
            </div>

            <!-- Year Filter -->
            <div>
              <label class="block text-gray-300 text-sm font-medium mb-2">Release Year</label>
              <select
                [(ngModel)]="selectedYear"
                (change)="applyFilters()"
                class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Any Year</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
                <option value="2022">2022</option>
                <option value="2021">2021</option>
                <option value="2020">2020</option>
                <option value="2015">2015-2019</option>
                <option value="2010">2010-2014</option>
                <option value="2000">2000-2009</option>
              </select>
            </div>

            <!-- Rating Filter -->
            <div>
              <label class="block text-gray-300 text-sm font-medium mb-2">Min Rating</label>
              <select
                [(ngModel)]="selectedRating"
                (change)="applyFilters()"
                class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Any Rating</option>
                <option value="9">9.0+</option>
                <option value="8">8.0+</option>
                <option value="7">7.0+</option>
                <option value="6">6.0+</option>
                <option value="5">5.0+</option>
              </select>
            </div>

            <!-- Sort By -->
            <div>
              <label class="block text-gray-300 text-sm font-medium mb-2">Sort By</label>
              <select
                [(ngModel)]="sortBy"
                (change)="applyFilters()"
                class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="popularity.desc">Most Popular</option>
                <option value="vote_average.desc">Highest Rated</option>
                <option value="release_date.desc">Newest</option>
                <option value="revenue.desc">Highest Revenue</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Movies Grid -->
        <!-- Loading State -->
        <div *ngIf="isLoading" class="flex justify-center items-center py-12">
          <div class="text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p class="text-gray-400">Loading movies...</p>
          </div>
        </div>

        <!-- Movies Grid -->
        <div *ngIf="!isLoading && movies.length > 0" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-8">
          <app-movie-card
            *ngFor="let movie of movies; trackBy: trackByMovieId"
            [movie]="movie"
            (viewDetails)="onViewDetails($event)"
            (logMovie)="onLogMovie($event)"
          ></app-movie-card>
        </div>

        <!-- Pagination -->
        <div *ngIf="!isLoading && totalPages > 1" class="flex justify-center gap-2 mt-8">
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

        <!-- No Results -->
        <div *ngIf="!isLoading && movies.length === 0" class="text-center py-12">
          <p class="text-gray-400 text-lg">No movies found with these filters.</p>
        </div>
      </div>
    </div>
  `,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiscoverComponent implements OnInit, OnDestroy {
  private tmdbService = inject(TmdbService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  movies: Movie[] = [];
  isLoading = false;
  currentPage = 1;
  totalPages = 1;

  // Filters
  selectedGenre = '';
  selectedYear = '';
  selectedRating = '';
  sortBy = 'popularity.desc';

  ngOnInit(): void {
    this.applyFilters();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadMovies();
  }

  loadMovies(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    // Build parameters for TMDB discover endpoint
    const params: any = {
      page: this.currentPage,
      sort_by: this.sortBy,
    };

    if (this.selectedGenre) {
      params.with_genres = this.selectedGenre;
    }

    if (this.selectedYear) {
      const year = parseInt(this.selectedYear, 10);
      if (year > 2015) {
        params.primary_release_year = year;
      } else if (year === 2015) {
        params['primary_release_date.gte'] = '2015-01-01';
        params['primary_release_date.lte'] = '2019-12-31';
      } else if (year === 2010) {
        params['primary_release_date.gte'] = '2010-01-01';
        params['primary_release_date.lte'] = '2014-12-31';
      } else if (year === 2000) {
        params['primary_release_date.gte'] = '2000-01-01';
        params['primary_release_date.lte'] = '2009-12-31';
      }
    }

    if (this.selectedRating) {
      params['vote_average.gte'] = this.selectedRating;
    }

    this.tmdbService.getDiscoverMovies(params).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.movies = response.results;
        this.totalPages = response.total_pages;
        this.isLoading = false;
        this.cdr.markForCheck();
        window.scrollTo(0, 0);
      },
      error: (err) => {
        console.error('Error loading movies:', err);
        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadMovies();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadMovies();
    }
  }

  onViewDetails(movie: Movie): void {
    this.router.navigate(['/movie', movie.id]);
  }

  onLogMovie(movie: Movie): void {
    this.router.navigate(['/movie', movie.id], { fragment: 'log' });
  }

  goHome(): void {
    this.router.navigate(['/home']);
  }

  trackByMovieId(index: number, movie: Movie): number {
    return movie.id;
  }
}
