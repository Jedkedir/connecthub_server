import { Post } from "../models/Post.js";
import { buildCreatedAtCursorFilter } from "../utils/pagination.js";
import mongoose from "mongoose";
import { hydratePostInteractions } from "../utils/postHelper.js";

/**
 * Encapsulates post persistence queries and mutations.
 */
export const postRepository = {
  /**
   * Creates a post document.
   */
  create: (data) => Post.create(data),
  /**
   * Finds a post by ID and hydrates current-user interaction state.
   */
  findById: async (userId, id) => {
    const post = await Post.findById(id).populate(
      "authorId",
      "fullname profilePic bio",
    );
    if (!post) return null;
    const hydrated = await hydratePostInteractions([post], userId);
    return hydrated[0];
  },
  /**
   * Finds a post by ID without hydration.
   */
  findByIdRaw: (id) => Post.findById(id),
  /**
   * Deletes a post by ID.
   */
  deleteById: (id) => Post.findByIdAndDelete(id),
  /**
   * Increments a numeric post counter field.
   */
  increment: (id, field, amount) =>
    Post.findByIdAndUpdate(id, { $inc: { [field]: amount } }, { new: true }),
  /**
   * Increments viewCount and returns the updated post.
   */
  incrementView: (id) =>
    Post.findByIdAndUpdate(id, { $inc: { viewCount: 1 } }, { new: true }),
  /**
   * Finds paginated posts by author and hydrates current-user interactions.
   */
  findByUser: async (currentUserId, userId, cursor, limit) => {
    const post = await Post.find({
      authorId: userId,
      ...buildCreatedAtCursorFilter(cursor),
    })
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .populate("authorId", "fullname username profilePic");
    if (post.length === 0) {
      return [];
    }
    return await hydratePostInteractions(post, currentUserId);
  },
};
