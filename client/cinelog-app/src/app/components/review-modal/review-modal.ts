import { Component, Input, Output, EventEmitter, inject, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CreateReviewRequest } from '../../services/review';
import { WatchlistService } from '../../services/watchlist';
import { ListService } from '../../services/list';

@Component({
  selector: 'app-review-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <!-- Backdrop -->
    <div
      *ngIf="isOpen"
      class="fixed inset-0 bg-black bg-opacity-50 z-40"
      (click)="onCancel()"
    ></div>

    <!-- Modal -->
    <div
      *ngIf="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center px-4 overflow-y-auto"
    >
      <div class="bg-gray-800 rounded-lg shadow-2xl w-full max-w-md my-8">
        <!-- Header -->
        <div class="border-b border-gray-700 px-6 py-4 flex justify-between items-center">
          <h2 class="text-xl font-bold text-white">Movie Actions</h2>
          <button
            (click)="onCancel()"
            class="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <!-- Content -->
        <div class="p-6 space-y-4 max-h-96 overflow-y-auto">
          <h3 class="text-lg text-white font-semibold mb-6">{{ movieTitle }}</h3>

          <!-- Quick Actions Section -->
          <div class="space-y-3 mb-6">
            <h4 class="text-gray-400 text-sm font-semibold uppercase">Quick Actions</h4>
            
            <!-- Add to Watchlist -->
            <button
              (click)="onAddToWatchlist()"
              [disabled]="isInWatchlist"
              class="w-full flex items-center gap-3 p-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:opacity-50 rounded-lg transition text-left"
            >
              <span class="text-xl">📚</span>
              <div>
                <p class="text-white font-semibold text-sm">{{ isInWatchlist ? '✓ In Watchlist' : 'Add to Watchlist' }}</p>
                <p class="text-gray-400 text-xs">Save for later (can do without rating)</p>
              </div>
            </button>

            <!-- Add to List -->
            <button
              (click)="toggleListDropdown = !toggleListDropdown"
              class="w-full flex items-center gap-3 p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition text-left"
            >
              <span class="text-xl">📋</span>
              <div>
                <p class="text-white font-semibold text-sm">Add to List</p>
                <p class="text-gray-400 text-xs">Independent of rating/review</p>
              </div>
              <span class="ml-auto">{{ toggleListDropdown ? '▼' : '▶' }}</span>
            </button>

            <!-- List Dropdown -->
            <div *ngIf="toggleListDropdown && userLists.length > 0" class="ml-6 space-y-2">
              <div *ngFor="let list of userLists">
                <button
                  (click)="onAddToList(list._id)"
                  class="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded transition"
                >
                  → {{ list.name }}
                </button>
              </div>
            </div>
          </div>

          <!-- Divider -->
          <div class="border-t border-gray-700 my-4"></div>

          <!-- Log & Rate Section -->
          <div class="space-y-4">
            <h4 class="text-gray-400 text-sm font-semibold uppercase">Log & Rate (Mark as Watched)</h4>
            
            <form [formGroup]="reviewForm" (ngSubmit)="onSubmit()" class="space-y-4">
              <!-- Rating -->
              <div>
                <label class="block text-gray-300 text-sm font-medium mb-3">Rating (required to mark watched)</label>
                <div class="flex gap-2">
                  <button
                    *ngFor="let star of [1, 2, 3, 4, 5]"
                    type="button"
                    (click)="setRating(star)"
                    [class.text-yellow-400]="rating >= star"
                    [class.text-gray-600]="rating < star"
                    class="text-3xl transition hover:scale-110"
                  >
                    ★
                  </button>
                  <button
                    type="button"
                    (click)="clearRating()"
                    class="ml-auto text-gray-400 hover:text-gray-300 text-sm"
                    *ngIf="rating > 0"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <!-- Watched Date -->
              <div>
                <label class="block text-gray-300 text-sm font-medium mb-2">Watched Date (optional)</label>
                <input
                  type="date"
                  formControlName="watchedDate"
                  class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <!-- Review Text -->
              <div>
                <label class="block text-gray-300 text-sm font-medium mb-2">Review (optional)</label>
                <textarea
                  formControlName="content"
                  placeholder="Share your thoughts..."
                  class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 h-20 resize-none"
                ></textarea>
              </div>

              <!-- Error Message -->
              <div *ngIf="errorMessage" class="bg-red-500 bg-opacity-20 border border-red-500 text-red-300 px-3 py-2 rounded text-sm">
                {{ errorMessage }}
              </div>

              <!-- Buttons -->
              <div class="flex gap-3 pt-4">
                <button
                  type="button"
                  (click)="onCancel()"
                  class="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition"
                >
                  Close
                </button>
                <button
                  type="submit"
                  [disabled]="isSubmitting || (rating === 0 && reviewForm.get('content')?.value?.trim() === '')"
                  class="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition"
                >
                  {{ isSubmitting ? 'Saving...' : 'Save Log' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewModalComponent implements OnInit {
  @Input() isOpen = false;
  @Input() movieTitle = '';
  @Input() tmdbId = 0;
  @Input() posterPath = '';
  @Output() submitted = new EventEmitter<CreateReviewRequest>();
  @Output() addedToWatchlist = new EventEmitter<number>(); // Emit tmdbId
  @Output() addedToList = new EventEmitter<{ listId: string; tmdbId: number }>(); // Emit listId and tmdbId
  @Output() cancelled = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private listService = inject(ListService);

  reviewForm: FormGroup;
  rating = 0;
  isSubmitting = false;
  errorMessage = '';
  isInWatchlist = false;
  userLists: any[] = [];
  toggleListDropdown = false;

  constructor() {
    this.reviewForm = this.fb.group({
      content: ['', [Validators.maxLength(5000)]],
      watchedDate: [new Date().toISOString().split('T')[0], Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadUserLists();
  }

  private loadUserLists(): void {
    this.listService.getUserLists(1).subscribe({
      next: (response: any) => {
        this.userLists = response.data || [];
      },
      error: () => {
        this.userLists = [];
      }
    });
  }

  setRating(value: number): void {
    this.rating = value;
  }

  clearRating(): void {
    this.rating = 0;
  }

  onAddToWatchlist(): void {
    this.addedToWatchlist.emit(this.tmdbId);
  }

  onAddToList(listId: string): void {
    this.addedToList.emit({ listId, tmdbId: this.tmdbId });
  }

  onSubmit(): void {
    // Allow submission if either rating or content is provided
    if (this.rating === 0 && this.reviewForm.get('content')?.value?.trim() === '') {
      this.errorMessage = 'Please add a rating or review';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const review: CreateReviewRequest = {
      tmdbId: this.tmdbId,
      movieTitle: this.movieTitle,
      posterPath: this.posterPath,
      rating: this.rating > 0 ? this.rating : 1, // Default to 1 if no rating
      content: this.reviewForm.get('content')?.value || '',
      watchedDate: new Date(this.reviewForm.get('watchedDate')?.value),
    };

    this.submitted.emit(review);
    // Don't reset form immediately - wait for parent response
  }

  onCancel(): void {
    this.cancelled.emit();
    this.resetForm();
  }

  private resetForm(): void {
    this.rating = 0;
    this.errorMessage = '';
    this.isSubmitting = false;
    this.toggleListDropdown = false;
    this.reviewForm.reset({
      watchedDate: new Date().toISOString().split('T')[0],
    });
  }
}
