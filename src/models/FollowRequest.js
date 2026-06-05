import mongoose from 'mongoose';

/**
 * Stores a pending or historical follow request between users.
 */
const followRequestSchema = new mongoose.Schema(
  {
    requesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    }
  },
  {
    timestamps: true
  }
);

followRequestSchema.index(
  { requesterId: 1, recipientId: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'pending' } }
);
followRequestSchema.index({ recipientId: 1, status: 1, createdAt: -1 });

/**
 * FollowRequest model for pending follow workflows.
 */
export const FollowRequest = mongoose.model('FollowRequest', followRequestSchema);
