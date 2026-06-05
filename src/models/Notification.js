import mongoose from 'mongoose';

/**
 * Stores user-facing notifications created from domain events.
 */
const notificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: {
      type: String,
      enum: ['LIKE', 'COMMENT', 'FOLLOW_REQUEST', 'FOLLOW_ACCEPTED', 'MENTION'],
      required: true
    },
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post'
    },
    commentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment'
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 240
    },
    isRead: {
      type: Boolean,
      default: false
    },
    dedupeKey: {
      type: String,
      unique: true,
      sparse: true
    }
  },
  {
    timestamps: true
  }
);

notificationSchema.index({ recipientId: 1, createdAt: -1 });
notificationSchema.index({ isRead: 1 });
notificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });

/**
 * Notification model for in-app notification records.
 */
export const Notification = mongoose.model('Notification', notificationSchema);
