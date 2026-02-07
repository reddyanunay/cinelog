import { Router } from 'express';
import {
  createList,
  getUserLists,
  getListById,
  addMovieToList,
  removeMovieFromList,
  updateList,
  deleteList,
} from '../controllers/listController';
import { protect } from '../middleware/auth';

const router = Router();

// Protected routes - all list operations require authentication
router.post('/', protect, createList);
router.get('/', protect, getUserLists);
router.get('/:id', protect, getListById);
router.post('/:id/movies', protect, addMovieToList);
router.delete('/:id/movies/:tmdbId', protect, removeMovieFromList);
router.patch('/:id', protect, updateList);
router.delete('/:id', protect, deleteList);

export default router;
