import { Request, Response, NextFunction } from 'express';
import { Schema } from 'mongoose';
import { Review, IReview } from '../models/Review';
import { asyncHandler, CustomError } from '../middleware/errorHandler';
import { AuthRequest } from './authController';

export const createReview = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const { tmdbId, movieTitle, posterPath, rating, content, watchedDate } = req.body;

    // Validation
    if (!tmdbId || !movieTitle || !rating) {
      const error: CustomError = new Error('Please provide tmdbId, movieTitle, and rating');
      error.statusCode = 400;
      throw error;
    }

    if (rating < 1 || rating > 5) {
      const error: CustomError = new Error('Rating must be between 1 and 5');
      error.statusCode = 400;
      throw error;
    }

    const review: IReview = await Review.create({
      user: req.user?.id as string,
      tmdbId,
      movieTitle,
      posterPath,
      rating,
      content,
      watchedDate: watchedDate || new Date(),
    });

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      review,
    });
  }
);

export const getReviewsByMovie = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const tmdbId = parseInt(id, 10);

    if (isNaN(tmdbId)) {
      const error: CustomError = new Error('Invalid movie ID');
      error.statusCode = 400;
      throw error;
    }

    const reviews = await Review.find({ tmdbId }).populate('user', 'username email');

    res.status(200).json({
      success: true,
      reviews,
    });
  }
);

export const getReviewsByUser = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = 10;
    const skip = (page - 1) * limit;

    // If ID is provided in params, get reviews for that user (public endpoint)
    // Otherwise, get reviews for the current authenticated user (protected endpoint)
    const userId = id || req.user?.id;

    if (!userId) {
      const error: CustomError = new Error('User ID not provided');
      error.statusCode = 400;
      throw error;
    }

    const total = await Review.countDocuments({ user: userId as any });
    const reviews = await Review.find({ user: userId as any })
      .populate('user', 'username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    if (!reviews) {
      const error: CustomError = new Error('Reviews not found');
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      data: reviews,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  }
);

export const getFeed = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const limit = parseInt((req.query.limit as string) || '20', 10);

    const reviews = await Review.find()
      .populate('user', 'username email')
      .sort({ createdAt: -1 })
      .limit(limit);

    res.status(200).json({
      success: true,
      reviews,
    });
  }
);

export const getReviewById = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;

    const review = await Review.findById(id).populate('user', 'username email');

    if (!review) {
      const error: CustomError = new Error('Review not found');
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      review,
    });
  }
);

export const updateReview = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const { rating, content, watchedDate } = req.body;

    const review = await Review.findById(id);

    if (!review) {
      const error: CustomError = new Error('Review not found');
      error.statusCode = 404;
      throw error;
    }

    if (review.user.toString() !== req.user?.id) {
      const error: CustomError = new Error('Not authorized to update this review');
      error.statusCode = 403;
      throw error;
    }

    review.rating = rating || review.rating;
    review.content = content || review.content;
    review.watchedDate = watchedDate || review.watchedDate;

    await review.save();

    res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      review,
    });
  }
);

export const deleteReview = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;

    const review = await Review.findById(id);

    if (!review) {
      const error: CustomError = new Error('Review not found');
      error.statusCode = 404;
      throw error;
    }

    if (review.user.toString() !== req.user?.id) {
      const error: CustomError = new Error('Not authorized to delete this review');
      error.statusCode = 403;
      throw error;
    }

    await Review.deleteOne({ _id: id });

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully',
    });
  }
);
