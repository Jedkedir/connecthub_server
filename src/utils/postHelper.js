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
  console.log('Hydrating interactions for user:', userId);
  console.log('Posts1:', posts);
  const postIds = posts.map(p => new mongoose.Types.ObjectId(p._id).toString());
  console.log('Post IDs to hydrate:', postIds);
  const [userLikes, userBookmarks] = await Promise.all([
    Like.find({ userId, postId: { $in: postIds } }).distinct('postId'),
    Bookmark.find({ userId, postId: { $in: postIds } }).distinct('postId')
]);
  console.log('User Likes:', userLikes);
  console.log('User Bookmarks:', userBookmarks);

  // userLikes is already an array of IDs like [ObjectId('...'), ObjectId('...')]
    const likedSet = new Set(userLikes.map(id => id.toString()));
    const bookmarkedSet = new Set(userBookmarks.map(id => id.toString()));

  console.log('Liked Post IDs:', Array.from(likedSet));
  console.log('Bookmarked Post IDs:', Array.from(bookmarkedSet));
  return posts.map(post => {
    const p = post.toObject?.() || post;
    console.log('Hydrating post:', p._id, 'Liked:', likedSet.has(p._id.toString()), 'Bookmarked:', bookmarkedSet.has(p._id.toString()));
    return {
      ...p,
      isLiked: likedSet.has(p._id.toString()),
      isBookmarked: bookmarkedSet.has(p._id.toString())
    };
  });
};