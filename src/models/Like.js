import mongoose from 'mongoose';

const likeSchema = new mongoose.Schema(
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

likeSchema.index({ userId: 1, postId: 1 }, { unique: true });
likeSchema.index({ postId: 1, createdAt: -1 });

export const Like = mongoose.model('Like', likeSchema);
