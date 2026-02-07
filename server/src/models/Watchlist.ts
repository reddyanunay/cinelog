import { Schema, model, Document } from 'mongoose';

export interface IWatchlist extends Document {
  user: Schema.Types.ObjectId;
  tmdbId: number;
  movieTitle: string;
  posterPath: string;
  addedAt: Date;
}

const watchlistSchema = new Schema<IWatchlist>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tmdbId: {
      type: Number,
      required: true,
    },
    movieTitle: {
      type: String,
      required: true,
    },
    posterPath: {
      type: String,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Compound index to prevent duplicates
watchlistSchema.index({ user: 1, tmdbId: 1 }, { unique: true });

export const Watchlist = model<IWatchlist>('Watchlist', watchlistSchema);
