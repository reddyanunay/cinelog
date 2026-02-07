import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface WatchlistItem {
  _id?: string;
  tmdbId: number;
  movieTitle: string;
  posterPath: string;
  addedAt: Date;
}

export interface WatchlistResponse {
  success: boolean;
  data: WatchlistItem[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  inWatchlist?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class WatchlistService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/watchlist';

  addToWatchlist(tmdbId: number, movieTitle: string, posterPath: string): Observable<WatchlistResponse> {
    return this.http.post<WatchlistResponse>(`${this.apiUrl}/add`, {
      tmdbId,
      movieTitle,
      posterPath,
    });
  }

  getWatchlist(page: number = 1): Observable<WatchlistResponse> {
    return this.http.get<WatchlistResponse>(`${this.apiUrl}?page=${page}`);
  }

  removeFromWatchlist(tmdbId: number): Observable<WatchlistResponse> {
    return this.http.delete<WatchlistResponse>(`${this.apiUrl}/${tmdbId}`);
  }

  checkInWatchlist(tmdbId: number): Observable<WatchlistResponse> {
    return this.http.get<WatchlistResponse>(`${this.apiUrl}/check/${tmdbId}`);
  }
}
