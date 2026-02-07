import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ListMovie {
  tmdbId: number;
  movieTitle: string;
  posterPath?: string;
}

export interface List {
  _id?: string;
  user?: string;
  name: string;
  description?: string;
  movies: ListMovie[];
  isPublic: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ListResponse {
  success: boolean;
  message?: string;
  list?: List;
  data?: List[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class ListService {
  private apiUrl = `${environment.apiUrl}/lists`;

  constructor(private http: HttpClient) {}

  /**
   * Create a new list
   */
  createList(name: string, description?: string, isPublic?: boolean): Observable<ListResponse>;
  createList(listData: { name: string; description?: string; isPublic?: boolean }): Observable<ListResponse>;
  createList(nameOrData: string | { name: string; description?: string; isPublic?: boolean }, description?: string, isPublic?: boolean): Observable<ListResponse> {
    const data = typeof nameOrData === 'string' 
      ? { name: nameOrData, description, isPublic } 
      : nameOrData;
    return this.http.post<ListResponse>(`${this.apiUrl}`, data);
  }

  /**
   * Get all lists for the current user (with pagination)
   */
  getLists(page: number = 1, limit: number = 10): Observable<ListResponse> {
    return this.http.get<ListResponse>(`${this.apiUrl}?page=${page}&limit=${limit}`);
  }

  /**
   * Get all lists for the current user (with pagination)
   */
  getUserLists(page: number = 1): Observable<ListResponse> {
    return this.http.get<ListResponse>(`${this.apiUrl}?page=${page}`);
  }

  /**
   * Get a specific list by ID
   */
  getListById(listId: string): Observable<ListResponse> {
    return this.http.get<ListResponse>(`${this.apiUrl}/${listId}`);
  }

  /**
   * Add a movie to a list
   */
  addMovieToList(listId: string, tmdbId: number, movieTitle: string, posterPath: string): Observable<ListResponse>;
  addMovieToList(listId: string, movieData: ListMovie): Observable<ListResponse>;
  addMovieToList(listId: string, tmdbIdOrData: number | ListMovie, movieTitle?: string, posterPath?: string): Observable<ListResponse> {
    const data = typeof tmdbIdOrData === 'number'
      ? { tmdbId: tmdbIdOrData, movieTitle: movieTitle!, posterPath }
      : tmdbIdOrData;
    return this.http.post<ListResponse>(`${this.apiUrl}/${listId}/movies`, data);
  }

  /**
   * Remove a movie from a list
   */
  removeMovieFromList(listId: string, tmdbId: number): Observable<ListResponse> {
    return this.http.delete<ListResponse>(`${this.apiUrl}/${listId}/movies/${tmdbId}`);
  }

  /**
   * Update a list
   */
  updateList(listId: string, listData: Partial<List>): Observable<ListResponse> {
    return this.http.patch<ListResponse>(`${this.apiUrl}/${listId}`, listData);
  }

  /**
   * Delete a list
   */
  deleteList(listId: string): Observable<ListResponse> {
    return this.http.delete<ListResponse>(`${this.apiUrl}/${listId}`);
  }
}
