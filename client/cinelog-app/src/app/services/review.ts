import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Review {
  _id: string;
  user: string;
  tmdbId: number;
  movieTitle: string;
  posterPath: string;
  rating: number;
  content: string;
  watchedDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateReviewRequest {
  tmdbId: number;
  movieTitle: string;
  posterPath: string;
  rating: number;
  content: string;
  watchedDate: Date;
}

export interface ReviewResponse {
  success: boolean;
  message: string;
  review?: Review;
  reviews?: Review[];
}

@Injectable({
  providedIn: 'root',
})
export class ReviewService {
  private apiUrl = `${environment.apiUrl}/reviews`;

  constructor(private http: HttpClient) {}

  /**
   * Create a new review
   */
  createReview(reviewData: CreateReviewRequest): Observable<ReviewResponse> {
    return this.http.post<ReviewResponse>(`${this.apiUrl}`, reviewData);
  }

  /**
   * Get all reviews for a specific movie
   */
  getReviewsByMovie(tmdbId: number): Observable<ReviewResponse> {
    return this.http.get<ReviewResponse>(`${this.apiUrl}/movie/${tmdbId}`);
  }

  /**
   * Get all reviews by a specific user
   */
  getReviewsByUser(userId: string): Observable<ReviewResponse> {
    return this.http.get<ReviewResponse>(`${this.apiUrl}/user/${userId}`);
  }

  /**
   * Get reviews for the current user (with pagination)
   */
  getUserReviews(page: number = 1): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}?page=${page}`);
  }

  /**
   * Get recent reviews from all users (feed)
   */
  getFeed(limit = 20): Observable<ReviewResponse> {
    return this.http.get<ReviewResponse>(`${this.apiUrl}/feed?limit=${limit}`);
  }

  /**
   * Get a specific review by ID
   */
  getReviewById(reviewId: string): Observable<ReviewResponse> {
    return this.http.get<ReviewResponse>(`${this.apiUrl}/${reviewId}`);
  }

  /**
   * Update a review
   */
  updateReview(reviewId: string, reviewData: Partial<CreateReviewRequest>): Observable<ReviewResponse> {
    return this.http.patch<ReviewResponse>(`${this.apiUrl}/${reviewId}`, reviewData);
  }

  /**
   * Delete a review
   */
  deleteReview(reviewId: string): Observable<ReviewResponse> {
    return this.http.delete<ReviewResponse>(`${this.apiUrl}/${reviewId}`);
  }
}
