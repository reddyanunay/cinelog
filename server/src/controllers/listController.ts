import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { List, IList } from '../models/List';
import { asyncHandler, CustomError } from '../middleware/errorHandler';
import { AuthRequest } from './authController';

export const createList = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const { name, description, isPublic } = req.body;

    // Validation
    if (!name) {
      const error: CustomError = new Error('Please provide a list name');
      error.statusCode = 400;
      throw error;
    }

    const list: IList = await List.create({
      user: req.user?.id as any,
      name,
      description: description || '',
      isPublic: isPublic || false,
      movies: [],
    });

    res.status(201).json({
      success: true,
      message: 'List created successfully',
      list,
    });
  }
);

export const getUserLists = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user?.id;
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = 10;
    const skip = (page - 1) * limit;

    if (!userId) {
      const error: CustomError = new Error('User ID not found');
      error.statusCode = 400;
      throw error;
    }

    const total = await List.countDocuments({ user: userId as any });
    const lists = await List.find({ user: userId as any })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: lists,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  }
);

export const getListById = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const userId = req.user?.id;

    const list = await List.findById(id).populate('user', 'username email');

    if (!list) {
      const error: CustomError = new Error('List not found');
      error.statusCode = 404;
      throw error;
    }

    // Check if user is authorized to view
    // After populate, list.user is an object with _id property
    const listUserId = (list.user as any)?._id?.toString() || list.user.toString();
    if (!list.isPublic && listUserId !== userId) {
      const error: CustomError = new Error('Not authorized to view this list');
      error.statusCode = 403;
      throw error;
    }

    res.status(200).json({
      success: true,
      list,
    });
  }
);

export const addMovieToList = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const { tmdbId, movieTitle, posterPath } = req.body;
    const userId = req.user?.id;

    // Validation
    if (!tmdbId || !movieTitle) {
      const error: CustomError = new Error('Please provide tmdbId and movieTitle');
      error.statusCode = 400;
      throw error;
    }

    const list = await List.findById(id);

    if (!list) {
      const error: CustomError = new Error('List not found');
      error.statusCode = 404;
      throw error;
    }

    if (list.user.toString() !== userId) {
      const error: CustomError = new Error('Not authorized to modify this list');
      error.statusCode = 403;
      throw error;
    }

    // Check if movie already in list
    const movieExists = list.movies.some((movie) => movie.tmdbId === tmdbId);
    if (movieExists) {
      const error: CustomError = new Error('Movie already in list');
      error.statusCode = 400;
      throw error;
    }

    list.movies.push({
      tmdbId,
      movieTitle,
      posterPath: posterPath || '',
    });

    await list.save();

    res.status(200).json({
      success: true,
      message: 'Movie added to list',
      list,
    });
  }
);

export const removeMovieFromList = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const { id, tmdbId } = req.params;
    const userId = req.user?.id;

    const list = await List.findById(id);

    if (!list) {
      const error: CustomError = new Error('List not found');
      error.statusCode = 404;
      throw error;
    }

    if (list.user.toString() !== userId) {
      const error: CustomError = new Error('Not authorized to modify this list');
      error.statusCode = 403;
      throw error;
    }

    list.movies = list.movies.filter((movie) => movie.tmdbId !== parseInt(tmdbId, 10));

    await list.save();

    res.status(200).json({
      success: true,
      message: 'Movie removed from list',
      list,
    });
  }
);

export const updateList = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const { name, description, isPublic } = req.body;
    const userId = req.user?.id;

    const list = await List.findById(id);

    if (!list) {
      const error: CustomError = new Error('List not found');
      error.statusCode = 404;
      throw error;
    }

    if (list.user.toString() !== userId) {
      const error: CustomError = new Error('Not authorized to modify this list');
      error.statusCode = 403;
      throw error;
    }

    list.name = name || list.name;
    list.description = description !== undefined ? description : list.description;
    list.isPublic = isPublic !== undefined ? isPublic : list.isPublic;

    await list.save();

    res.status(200).json({
      success: true,
      message: 'List updated successfully',
      list,
    });
  }
);

export const deleteList = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const userId = req.user?.id;

    const list = await List.findById(id);

    if (!list) {
      const error: CustomError = new Error('List not found');
      error.statusCode = 404;
      throw error;
    }

    if (list.user.toString() !== userId) {
      const error: CustomError = new Error('Not authorized to delete this list');
      error.statusCode = 403;
      throw error;
    }

    await List.deleteOne({ _id: id });

    res.status(200).json({
      success: true,
      message: 'List deleted successfully',
    });
  }
);
