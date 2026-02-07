import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Movie } from '../../services/tmdb';
import { TmdbService } from '../../services/tmdb';

@Component({
  selector: 'app-movie-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="group relative h-80 cursor-pointer overflow-hidden rounded-lg shadow-lg transition transform hover:scale-105 hover:shadow-2xl">
      <!-- Movie Poster -->
      <img
        [src]="getPosterUrl()"
        [alt]="movie.title"
        class="h-full w-full object-cover transition group-hover:opacity-80"
      />

      <!-- Overlay on Hover -->
      <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-70 transition duration-300 flex flex-col justify-end p-4">
        <!-- Title and Info -->
        <div class="opacity-0 group-hover:opacity-100 transition duration-300">
          <h3 class="text-lg font-bold text-white mb-2 line-clamp-2">{{ movie.title }}</h3>

          <!-- Rating -->
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-1">
              <span class="text-yellow-400">⭐</span>
              <span class="text-white text-sm font-semibold">{{ (movie.vote_average / 2).toFixed(1) }}/5</span>
            </div>
            <span class="text-gray-300 text-xs">{{ movie.release_date | slice:0:4 }}</span>
          </div>

          <!-- Description -->
          <p class="text-gray-200 text-xs mb-3 line-clamp-3">{{ movie.overview }}</p>

          <!-- Action Buttons -->
          <div class="flex gap-2">
            <button
              (click)="onViewDetails()"
              class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded text-xs transition"
            >
              View Details
            </button>
            <button
              (click)="onLogMovie()"
              class="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-2 rounded text-xs transition"
            >
              Log Movie
            </button>
          </div>
        </div>
      </div>

      <!-- Release Year Badge -->
      <div class="absolute top-2 right-2 bg-black bg-opacity-60 px-2 py-1 rounded text-xs text-white">
        {{ movie.release_date | slice:0:4 }}
      </div>
    </div>
  `,
  styles: ``,
})
export class MovieCard {
  @Input() movie!: Movie;
  @Output() viewDetails = new EventEmitter<Movie>();
  @Output() logMovie = new EventEmitter<Movie>();

  constructor(private tmdbService: TmdbService) {}

  getPosterUrl(): string {
    return this.tmdbService.getPosterUrl(this.movie.poster_path, 'w342');
  }

  onViewDetails(): void {
    this.viewDetails.emit(this.movie);
  }

  onLogMovie(): void {
    this.logMovie.emit(this.movie);
  }
}
