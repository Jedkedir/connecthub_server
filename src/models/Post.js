import mongoose from "mongoose";

/**
 * Stores authored social posts, media links, topics, and interaction counters.
 */
const postSchema = new mongoose.Schema(
  {
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    mediaUrls: {
      type: [String],
      default: [],
    },
    topics: {
      type: [String],
      default: [],
    },
    likesCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    commentsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    bookmarksCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    viewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
);

postSchema.index({ createdAt: -1, _id: -1 });
postSchema.index({ authorId: 1, createdAt: -1 });
postSchema.index({ content: "text" });
postSchema.index({ topics: 1 });
postSchema.index({ likesCount: -1, commentsCount: -1, viewCount: -1 });

/**
 * Post model for feed and profile content.
 */
export const Post = mongoose.model("Post", postSchema);
