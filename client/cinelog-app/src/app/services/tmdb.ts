import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  release_date: string;
  vote_average: number;
  popularity: number;
  genre_ids?: number[];
}

export interface MovieDetails extends Movie {
  runtime: number;
  genres: Array<{ id: number; name: string }>;
  tagline: string;
  budget: number;
  revenue: number;
  status: string;
  original_language: string;
  homepage?: string;
  imdb_id?: string;
}

export interface TMDBResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface GenresResponse {
  genres: Array<{ id: number; name: string }>;
}

export interface MovieVideo {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
}

export interface VideosResponse {
  id: number;
  results: MovieVideo[];
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

export interface CreditsResponse {
  id: number;
  cast: CastMember[];
  crew: CrewMember[];
}

@Injectable({
  providedIn: 'root',
})
export class TmdbService {
  private apiKey = environment.tmdbApiKey;
  private baseUrl = environment.tmdbBaseUrl;
  private imageBaseUrl = 'https://image.tmdb.org/t/p';

  constructor(private http: HttpClient) {}

  /**
   * Get trending movies
   */
  getTrendingMovies(timeWindow: 'day' | 'week' = 'week', page = 1): Observable<TMDBResponse<Movie>> {
    const params = new HttpParams()
      .set('api_key', this.apiKey)
      .set('page', page.toString());

    return this.http.get<TMDBResponse<Movie>>(
      `${this.baseUrl}/trending/movie/${timeWindow}`,
      { params }
    );
  }

  /**
   * Search for movies by query
   */
  searchMovies(query: string, page = 1): Observable<TMDBResponse<Movie>> {
    const params = new HttpParams()
      .set('api_key', this.apiKey)
      .set('query', query)
      .set('page', page.toString());

    return this.http.get<TMDBResponse<Movie>>(
      `${this.baseUrl}/search/movie`,
      { params }
    );
  }

  /**
   * Get movie details by ID
   */
  getMovieDetails(movieId: number): Observable<MovieDetails> {
    const params = new HttpParams().set('api_key', this.apiKey);

    return this.http.get<MovieDetails>(
      `${this.baseUrl}/movie/${movieId}`,
      { params }
    );
  }

  /**
   * Get movie recommendations
   */
  getMovieRecommendations(movieId: number, page = 1): Observable<TMDBResponse<Movie>> {
    const params = new HttpParams()
      .set('api_key', this.apiKey)
      .set('page', page.toString());

    return this.http.get<TMDBResponse<Movie>>(
      `${this.baseUrl}/movie/${movieId}/recommendations`,
      { params }
    );
  }

  /**
   * Get all genres
   */
  getGenres(): Observable<GenresResponse> {
    const params = new HttpParams().set('api_key', this.apiKey);

    return this.http.get<GenresResponse>(
      `${this.baseUrl}/genre/movie/list`,
      { params }
    );
  }

  /**
   * Get movies by genre
   */
  getMoviesByGenre(genreId: number, page = 1): Observable<TMDBResponse<Movie>> {
    const params = new HttpParams()
      .set('api_key', this.apiKey)
      .set('with_genres', genreId.toString())
      .set('page', page.toString());

    return this.http.get<TMDBResponse<Movie>>(
      `${this.baseUrl}/discover/movie`,
      { params }
    );
  }

  /**
   * Discover movies with filters and sorting
   */
  getDiscoverMovies(filterParams: any): Observable<TMDBResponse<Movie>> {
    let params = new HttpParams()
      .set('api_key', this.apiKey);

    // Add all filter parameters
    Object.keys(filterParams).forEach(key => {
      params = params.set(key, filterParams[key].toString());
    });

    return this.http.get<TMDBResponse<Movie>>(
      `${this.baseUrl}/discover/movie`,
      { params }
    );
  }

  /**
   * Get image URL for a poster
   */
  getPosterUrl(path: string | null, size: 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'original' = 'w342'): string {
    if (!path) {
      return 'https://via.placeholder.com/342x513?text=No+Image';
    }
    return `${this.imageBaseUrl}/${size}${path}`;
  }

  /**
   * Get backdrop image URL
   */
  getBackdropUrl(path: string | null, size: 'w300' | 'w780' | 'w1280' | 'original' = 'w780'): string {
    if (!path) {
      return 'https://via.placeholder.com/1280x720?text=No+Backdrop';
    }
    return `${this.imageBaseUrl}/${size}${path}`;
  }

  /**
   * Get movie videos (trailers, teasers, etc.)
   */
  getMovieVideos(movieId: number): Observable<VideosResponse> {
    const params = new HttpParams().set('api_key', this.apiKey);

    return this.http.get<VideosResponse>(
      `${this.baseUrl}/movie/${movieId}/videos`,
      { params }
    );
  }

  /**
   * Get movie credits (cast and crew)
   */
  getMovieCredits(movieId: number): Observable<CreditsResponse> {
    const params = new HttpParams().set('api_key', this.apiKey);

    return this.http.get<CreditsResponse>(
      `${this.baseUrl}/movie/${movieId}/credits`,
      { params }
    );
  }
}
