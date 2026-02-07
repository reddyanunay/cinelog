import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { protect, AuthRequest } from '../middleware/auth';
import { Watchlist } from '../models/Watchlist';

const router = express.Router();

// Add movie to watchlist
router.post('/add', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { tmdbId, movieTitle, posterPath } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!tmdbId || !movieTitle) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Check if already in watchlist
    const existing = await Watchlist.findOne({
      user: userId as any,
      tmdbId,
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Movie already in watchlist' });
    }

    const watchlist = new Watchlist({
      user: userId as any,
      tmdbId,
      movieTitle,
      posterPath,
      addedAt: new Date(),
    });

    await watchlist.save();
    res.json({ success: true, message: 'Added to watchlist', data: watchlist });
  } catch (error) {
    next(error);
  }
});

// Get user's watchlist
router.get('/', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const total = await Watchlist.countDocuments({
      user: userId as any,
    });
    const watchlist = await Watchlist.find({
      user: userId as any,
    })
      .sort({ addedAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      data: watchlist,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Remove from watchlist
router.delete('/:tmdbId', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const tmdbId = parseInt(req.params.tmdbId, 10);

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const result = await Watchlist.findOneAndDelete({
      user: userId as any,
      tmdbId,
    });
    if (!result) {
      return res.status(404).json({ success: false, message: 'Not found in watchlist' });
    }

    res.json({ success: true, message: 'Removed from watchlist' });
  } catch (error) {
    next(error);
  }
});

// Check if movie in watchlist
router.get('/check/:tmdbId', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const tmdbId = parseInt(req.params.tmdbId, 10);

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const exists = await Watchlist.findOne({
      user: userId as any,
      tmdbId,
    });
    res.json({ success: true, inWatchlist: !!exists });
  } catch (error) {
    next(error);
  }
});

export default router;
