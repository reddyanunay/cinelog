import { Component, inject, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ListService, List } from '../../services/list';
import { WatchlistService } from '../../services/watchlist';
import { ToastService } from '../../services/toast.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-lists',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
        <!-- Page Title -->
        <div class="mb-8">
          <h2 class="text-3xl font-bold text-white mb-2">My Lists</h2>
          <p class="text-gray-400">Organize your favorite movies into custom collections</p>
        </div>

        <!-- Create New List Section -->
        <div class="bg-gray-800 rounded-lg p-6 mb-8 border border-gray-700">
          <h3 class="text-xl font-bold text-white mb-4">Create a New List</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-gray-300 mb-2">List Name *</label>
              <input
                [(ngModel)]="newListName"
                type="text"
                placeholder="e.g., Sci-Fi Classics, Must Watch"
                class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label class="block text-gray-300 mb-2">Description</label>
              <textarea
                [(ngModel)]="newListDescription"
                placeholder="Add a description for your list..."
                class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 min-h-24"
              ></textarea>
            </div>
            <div class="flex items-center gap-2">
              <input
                [(ngModel)]="newListIsPublic"
                type="checkbox"
                id="isPublic"
                class="w-4 h-4 rounded"
              />
              <label for="isPublic" class="text-gray-300">Make this list public</label>
            </div>
            <button
              (click)="createNewList()"
              [disabled]="!newListName || isLoadingCreate"
              class="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-6 rounded-lg transition"
            >
              {{ isLoadingCreate ? 'Creating...' : 'Create List' }}
            </button>
          </div>
        </div>

        <!-- Error Message -->
        <div *ngIf="errorMessage" class="bg-red-500 bg-opacity-20 border border-red-500 text-red-300 px-4 py-3 rounded-lg mb-6">
          {{ errorMessage }}
        </div>

        <!-- Loading State -->
        <div *ngIf="isLoading && lists.length === 0" class="flex justify-center py-12">
          <div class="text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p class="text-gray-400">Loading your lists...</p>
          </div>
        </div>

        <!-- Lists Grid -->
        <div *ngIf="!isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <!-- Watchlist Card (Default List - Always show) -->
          <div class="bg-gradient-to-br from-blue-900 to-blue-800 rounded-lg p-6 border-2 border-blue-600 hover:border-blue-500 transition shadow-lg">
            <!-- List Header -->
            <div class="mb-4">
              <h3 class="text-xl font-bold text-white mb-1">📚 Watchlist</h3>
              <p class="text-gray-300 text-sm mb-2">Your default watchlist (cannot be deleted)</p>
              <span class="inline-block bg-blue-700 text-white text-xs px-2 py-1 rounded">
                ⭐ Default List
              </span>
            </div>

            <!-- Movie Count -->
            <div class="mb-4">
              <p class="text-gray-200">
                <span class="font-bold">{{ watchlistCount }}</span> movie{{ watchlistCount !== 1 ? 's' : '' }}
              </p>
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-2">
              <button
                (click)="viewWatchlist()"
                class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition"
              >
                View
              </button>
            </div>
          </div>

          <!-- Custom Lists -->
          <div *ngFor="let list of lists" class="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition">
            <!-- List Header -->
            <div class="mb-4">
              <h3 class="text-xl font-bold text-white mb-1">{{ list.name }}</h3>
              <p class="text-gray-400 text-sm mb-2">{{ list.description || 'No description' }}</p>
              <span *ngIf="list.isPublic" class="inline-block bg-blue-600 text-white text-xs px-2 py-1 rounded">
                🌐 Public
              </span>
            </div>

            <!-- Movie Count -->
            <div class="mb-4">
              <p class="text-gray-300">
                <span class="font-bold">{{ list.movies.length }}</span> movie{{ list.movies.length !== 1 ? 's' : '' }}
              </p>
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-2">
              <button
                (click)="viewList(list._id!)"
                class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition"
              >
                View
              </button>
              <button
                (click)="editList(list)"
                class="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded transition"
              >
                Edit
              </button>
              <button
                (click)="deleteListConfirm(list._id!)"
                class="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition"
              >
                🗑️
              </button>
            </div>
          </div>

          <!-- No Custom Lists Message (inside grid) -->
          <div *ngIf="lists.length === 0" class="col-span-full text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
            <p class="text-gray-400 text-lg mb-2">No custom lists yet.</p>
            <p class="text-gray-500 text-sm">Your watchlist is shown above. Create more lists to organize your movies!</p>
          </div>
        </div>

        <!-- Pagination -->
        <div *ngIf="!isLoading && lists.length > 0 && paginationData && paginationData.pages > 1" class="flex justify-center gap-2 mt-8">
          <button
            (click)="previousPage()"
            [disabled]="currentPage === 1"
            class="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded transition"
          >
            ← Previous
          </button>
          <div class="bg-gray-800 rounded px-4 py-2 text-white">
            Page {{ currentPage }} of {{ paginationData.pages }}
          </div>
          <button
            (click)="nextPage()"
            [disabled]="currentPage === paginationData.pages"
            class="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded transition"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  `,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListsComponent implements OnInit, OnDestroy {
  private listService = inject(ListService);
  private watchlistService = inject(WatchlistService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  lists: List[] = [];
  isLoading = false;
  isLoadingCreate = false;
  errorMessage = '';
  currentPage = 1;
  paginationData: any = null;
  watchlistCount = 0;

  newListName = '';
  newListDescription = '';
  newListIsPublic = false;

  ngOnInit(): void {
    this.loadLists();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadLists(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    this.listService.getUserLists(this.currentPage).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        const allLists = response.data || [];
        
        // Find watchlist and separate it from custom lists
        const watchlist = allLists.find(list => list.name === 'Watchlist');
        this.watchlistCount = watchlist ? watchlist.movies.length : 0;
        
        // Filter out watchlist from regular lists
        this.lists = allLists.filter(list => list.name !== 'Watchlist');
        
        this.paginationData = response.pagination;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading lists:', err);
        this.errorMessage = 'Failed to load lists. Please try again.';
        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  createNewList(): void {
    if (!this.newListName.trim()) {
      this.errorMessage = 'List name is required';
      this.cdr.markForCheck();
      return;
    }

    this.isLoadingCreate = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    this.listService.createList({
      name: this.newListName,
      description: this.newListDescription,
      isPublic: this.newListIsPublic,
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.toastService.success(`List "${this.newListName}" created successfully!`);
        this.newListName = '';
        this.newListDescription = '';
        this.newListIsPublic = false;
        this.isLoadingCreate = false;
        this.currentPage = 1;
        this.loadLists();
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error creating list:', err);
        this.errorMessage = err.error?.message || 'Failed to create list. Please try again.';
        this.toastService.error(this.errorMessage);
        this.isLoadingCreate = false;
        this.cdr.markForCheck();
      },
    });
  }

  viewList(listId: string): void {
    this.router.navigate(['/list-details', listId]);
  }

  viewWatchlist(): void {
    console.log('🔍 Looking for watchlist...');
    // Find watchlist ID and navigate to list details
    this.listService.getUserLists(1).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        console.log('📋 Lists response:', response);
        const watchlist = response.data?.find(list => list.name === 'Watchlist');
        console.log('📚 Found watchlist:', watchlist);
        
        if (watchlist && watchlist._id) {
          console.log('✅ Navigating to watchlist details:', watchlist._id);
          this.router.navigate(['/list-details', watchlist._id]);
        } else {
          console.log('➕ Creating new watchlist...');
          // Create watchlist if it doesn't exist
          this.listService.createList('Watchlist', 'Your default watchlist', false).pipe(
            takeUntil(this.destroy$)
          ).subscribe({
            next: (createResponse) => {
              console.log('✅ Watchlist created:', createResponse);
              if (createResponse.list?._id) {
                this.router.navigate(['/list-details', createResponse.list._id]);
              }
            },
            error: (err) => {
              console.error('❌ Error creating watchlist:', err);
              this.errorMessage = 'Failed to create watchlist';
              this.toastService.error('Failed to create watchlist');
              this.cdr.markForCheck();
            }
          });
        }
      },
      error: (err) => {
        console.error('Error finding watchlist:', err);
      }
    });
  }

  editList(list: List): void {
    this.router.navigate(['/list-edit', list._id]);
  }

  deleteListConfirm(listId: string): void {
    if (confirm('Are you sure you want to delete this list?')) {
      this.listService.deleteList(listId).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: () => {
          this.toastService.success('List deleted successfully');
          this.loadLists();
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error deleting list:', err);
          this.errorMessage = 'Failed to delete list. Please try again.';
          this.toastService.error(this.errorMessage);
          this.cdr.markForCheck();
        },
      });
    }
  }

  nextPage(): void {
    if (this.currentPage < this.paginationData.pages) {
      this.currentPage++;
      this.loadLists();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadLists();
    }
  }

  goHome(): void {
    this.router.navigate(['/home']);
  }
}
