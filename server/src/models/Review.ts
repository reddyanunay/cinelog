import { Schema, model, Document, Types } from 'mongoose';

export interface IReview extends Document {
  user: Types.ObjectId;
  tmdbId: number;
  movieTitle: string;
  posterPath: string;
  rating: number;
  content: string;
  watchedDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
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
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    content: {
      type: String,
      maxlength: 5000,
    },
    watchedDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export const Review = model<IReview>('Review', reviewSchema);
