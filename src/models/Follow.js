import mongoose from 'mongoose';

/**
 * Stores an accepted follower-to-following relationship between users.
 */
const followSchema = new mongoose.Schema(
  {
    followerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    followingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

followSchema.index({ followerId: 1, followingId: 1 }, { unique: true });
followSchema.index({ followerId: 1 });
followSchema.index({ followingId: 1 });

/**
 * Follow model for established user relationships.
 */
export const Follow = mongoose.model('Follow', followSchema);
