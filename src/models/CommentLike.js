import mongoose from 'mongoose';

/**
 * Stores a user's like relationship with a comment.
 */
const commentLikeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    commentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      required: true
    }
  },
  {
    timestamps: true
  }
);

commentLikeSchema.index({ userId: 1, commentId: 1 }, { unique: true });
commentLikeSchema.index({ commentId: 1, createdAt: -1 });

/**
 * CommentLike model for comment like relationships.
 */
export const CommentLike = mongoose.model('CommentLike', commentLikeSchema);
