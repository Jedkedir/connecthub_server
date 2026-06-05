import mongoose from 'mongoose';

/**
 * Stores a user's saved post relationship.
 */
const bookmarkSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true
    }
  },
  {
    timestamps: true
  }
);

bookmarkSchema.index({ userId: 1, postId: 1 }, { unique: true });
bookmarkSchema.index({ userId: 1, createdAt: -1 });

/**
 * Bookmark model for saved posts.
 */
export const Bookmark = mongoose.model('Bookmark', bookmarkSchema);
