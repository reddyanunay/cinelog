import { Router } from 'express';
import {
  createReview,
  getReviewsByMovie,
  getReviewsByUser,
  getFeed,
  getReviewById,
  updateReview,
  deleteReview,
} from '../controllers/reviewController';
import { protect } from '../middleware/auth';

const router = Router();

// Protected routes
router.post('/', protect, createReview);
router.get('/', protect, getReviewsByUser);  // Current user's reviews with pagination

// Public routes - place /feed and /:id before more specific routes to avoid conflicts
router.get('/feed', getFeed);
router.get('/movie/:id', getReviewsByMovie);
router.get('/user/:id', getReviewsByUser);
router.get('/:id', getReviewById);

// Protected routes (continued)
router.patch('/:id', protect, updateReview);
router.delete('/:id', protect, deleteReview);

export default router;
