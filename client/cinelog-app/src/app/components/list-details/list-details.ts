import { Component, inject, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ListService, List } from '../../services/list';
import { TmdbService } from '../../services/tmdb';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-list-details',
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
            <p class="text-gray-400">Loading list...</p>
          </div>
        </div>

        <!-- Error State -->
        <div *ngIf="errorMessage && !isLoading" class="bg-red-500 bg-opacity-20 border border-red-500 text-red-300 px-6 py-4 rounded-lg mb-6">
          {{ errorMessage }}
        </div>

        <!-- List Details -->
        <div *ngIf="list && !isLoading" class="space-y-6">
          <!-- Header -->
          <div class="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h1 class="text-4xl font-bold text-white mb-2">{{ list.name }}</h1>
            <p *ngIf="list.description" class="text-gray-400 text-lg mb-4">{{ list.description }}</p>
            <div class="flex gap-4">
              <span class="text-gray-300">
                <span class="font-bold">{{ list.movies.length }}</span> movie{{ list.movies.length !== 1 ? 's' : '' }}
              </span>
              <span *ngIf="list.isPublic" class="inline-block bg-blue-600 text-white text-sm px-3 py-1 rounded">
                🌐 Public
              </span>
            </div>
          </div>

          <!-- Movies Grid -->
          <div *ngIf="list.movies && list.movies.length > 0" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <div *ngFor="let movie of list.movies" class="group cursor-pointer" (click)="viewMovie(movie.tmdbId)">
              <div class="relative overflow-hidden rounded-lg shadow-lg bg-gray-800 h-full transition transform hover:scale-105">
                <!-- Movie Poster -->
                <img
                  [src]="getMoviePosterUrl(movie.posterPath || '')"
                  [alt]="movie.movieTitle"
                  class="w-full h-80 object-cover"
                />
                <!-- Overlay -->
                <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition flex items-end p-4">
                  <div class="text-white opacity-0 group-hover:opacity-100 transition w-full">
                    <p class="font-bold line-clamp-2">{{ movie.movieTitle }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- No Movies Message -->
          <div *ngIf="!list.movies || list.movies.length === 0" class="text-center py-12">
            <p class="text-gray-400 text-lg mb-4">No movies in this list yet.</p>
            <button
              (click)="goBack()"
              class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition"
            >
              Back to Lists
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListDetailsComponent implements OnInit, OnDestroy {
  private listService = inject(ListService);
  private tmdbService = inject(TmdbService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  list: List | null = null;
  isLoading = false;
  errorMessage = '';

  ngOnInit(): void {
    this.route.params.pipe(
      takeUntil(this.destroy$)
    ).subscribe(params => {
      const listId = params['id'];
      if (listId) {
        this.loadList(listId);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadList(listId: string): void {
    console.log('📋 Loading list with ID:', listId);
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    this.listService.getListById(listId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        console.log('✅ List loaded:', response);
        this.list = response.list || null;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('❌ Error loading list:', err);
        this.errorMessage = 'Failed to load list: ' + (err.error?.message || err.message);
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

  goBack(): void {
    this.router.navigate(['/lists']);
  }

  goHome(): void {
    this.router.navigate(['/home']);
  }
}
