import { Bookmark } from '../models/Bookmark.js';
import { Comment } from '../models/Comment.js';
import { Like } from '../models/Like.js';
import { buildCreatedAtCursorFilter } from '../utils/pagination.js';

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
  findBookmarksByUser: (userId, cursor, limit) =>
    Bookmark.find({ userId, ...buildCreatedAtCursorFilter(cursor) })
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .populate({
        path: 'postId',
        populate: { path: 'authorId', select: 'username profilePic' }
      })
};
