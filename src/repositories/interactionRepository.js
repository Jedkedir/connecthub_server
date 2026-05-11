import { Bookmark } from '../models/Bookmark.js';
import { Comment } from '../models/Comment.js';
import { Like } from '../models/Like.js';
import { buildCreatedAtCursorFilter } from '../utils/pagination.js';
import { hydratePostInteractions } from "../utils/postHelper.js";

export const interactionRepository = {
  createLike: (userId, postId) => Like.create({ userId, postId }),
  deleteLike: (userId, postId) => Like.findOneAndDelete({ userId, postId }),
  createComment: (data) => Comment.create(data),
  findCommentsByPost: (postId, cursor, limit) =>
    Comment.find({ postId, ...buildCreatedAtCursorFilter(cursor) })
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .populate('userId', 'username profilePic'),
  createBookmark: (userId, postId) => Bookmark.create({ userId, postId }),
  deleteBookmark: (userId, postId) => Bookmark.findOneAndDelete({ userId, postId }),
  findBookmarksByUser: async (userId, cursor, limit) => {
    const bookmarks = await Bookmark.find({ userId, ...buildCreatedAtCursorFilter(cursor) })
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .populate({
        path: 'postId',
        populate: { path: 'authorId', select: 'username profilePic' }
      });

    // 1. Extract the nested Post objects
    const posts = bookmarks.map(b => b.postId).filter(Boolean);

    // 2. Hydrate the posts (pass the user's ID to check if they liked/bookmarked them)
    const hydratedPosts = await hydratePostInteractions(posts, userId);

    // 3. Map them back into the bookmark objects
    return bookmarks.map((bookmark, index) => {
      const b = bookmark.toObject();
      return {
        ...b,
        postId: hydratedPosts.find(p => p._id.toString() === b.postId._id.toString())
      };
    });
  },

  findLikedPostsByUser: async (userId, cursor, limit) => {
    const likes = await Like.find({ userId, ...buildCreatedAtCursorFilter(cursor) })
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .populate({
        path: 'postId',
        populate: { path: 'authorId', select: 'username profilePic' }
      });

    const posts = likes.map(l => l.postId).filter(Boolean);
    const hydratedPosts = await hydratePostInteractions(posts, userId);

    return likes.map(like => {
      const l = like.toObject();
      return {
        ...l,
        postId: hydratedPosts.find(p => p._id.toString() === l.postId._id.toString())
      };
    });
  }
};
