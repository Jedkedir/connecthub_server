import mongoose from 'mongoose';
import { Like } from '../models/Like.js'; 
import { Bookmark } from '../models/Bookmark.js';

export const hydratePostInteractions = async (posts, userId) => {
   // 1. Correct way to check for empty array
  if (!posts || posts.length === 0) {
    return [];
  }

  // 2. If no user is logged in, return posts with false flags immediately
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

  // userLikes is already an array of IDs like [ObjectId('...'), ObjectId('...')]
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