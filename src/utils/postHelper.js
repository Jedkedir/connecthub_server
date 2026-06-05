import mongoose from 'mongoose';
import { Like } from '../models/Like.js'; 
import { Bookmark } from '../models/Bookmark.js';

/**
 * Adds current-user like and bookmark state to post documents.
 * @param {Object[]} posts - Mongoose post documents or plain post objects.
 * @param {string|null} userId - Current user used to compute interaction flags.
 * @returns {Promise<Object[]>} Posts with isLiked and isBookmarked properties.
 */
export const hydratePostInteractions = async (posts, userId) => {
  if (!posts || posts.length === 0) {
    return [];
  }

  if (!userId) {
    return posts.map(post => {
      const p = post.toObject?.() || post;
      return { ...p, isLiked: false, isBookmarked: false };
    });
  }
  const postIds = posts.map(p => new mongoose.Types.ObjectId(p._id).toString());
  const [userLikes, userBookmarks] = await Promise.all([
    Like.find({ userId, postId: { $in: postIds } }).distinct('postId'),
    Bookmark.find({ userId, postId: { $in: postIds } }).distinct('postId')
]);

    const likedSet = new Set(userLikes.map(id => id.toString()));
    const bookmarkedSet = new Set(userBookmarks.map(id => id.toString()));
  return posts.map(post => {
    const p = post.toObject?.() || post;
    return {
      ...p,
      isLiked: likedSet.has(p._id.toString()),
      isBookmarked: bookmarkedSet.has(p._id.toString())
    };
  });
};
