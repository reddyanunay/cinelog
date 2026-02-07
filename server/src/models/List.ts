import { Schema, model, Document } from 'mongoose';

export interface IList extends Document {
  user: Schema.Types.ObjectId;
  name: string;
  description?: string;
  movies: {
    tmdbId: number;
    movieTitle: string;
    posterPath?: string;
  }[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ListSchema = new Schema<IList>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    movies: [
      {
        tmdbId: Number,
        movieTitle: String,
        posterPath: String,
      },
    ],
    isPublic: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Index for user lists
ListSchema.index({ user: 1, name: 1 }, { unique: true });

export const List = model<IList>('List', ListSchema);
