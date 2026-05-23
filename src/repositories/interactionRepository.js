import mongoose from "mongoose";
import { Bookmark } from "../models/Bookmark.js";
import { Comment } from "../models/Comment.js";
import { CommentLike } from "../models/CommentLike.js";
import { Like } from "../models/Like.js";
import { buildCreatedAtCursorFilter } from "../utils/pagination.js";
import { hydratePostInteractions } from "../utils/postHelper.js";
import { hydrateComment, hydrateComments } from "../utils/commentHelper.js";
// Helper function to populate user info
const populateCommentUser = (query) => {
  return query.populate("userId", "fullname username profilePic");
};
export const interactionRepository = {
  createLike: (userId, postId) => Like.create({ userId, postId }),
  deleteLike: (userId, postId) => Like.findOneAndDelete({ userId, postId }),
  createComment: (data) => Comment.create(data),

  // Updated findCommentsByPost with hydration
  findCommentsByPost: async (postId, cursor, limit, userId = null) => {
    const comments = await populateCommentUser(
      Comment.find({
        postId,
        parentCommentId: null, // Only get top-level comments
        ...buildCreatedAtCursorFilter(cursor),
      })
        .sort({ createdAt: -1, _id: -1 })
        .limit(limit + 1),
    );

    // Hydrate comments with their replies
    const hydratedComments = await hydrateComments(comments, userId);

    return hydratedComments;
  },

  // New method: Find replies for a specific comment
  findRepliesByComment: async (commentId, cursor, limit, userId = null) => {
    const replies = await populateCommentUser(
      Comment.find({
        parentCommentId: commentId,
        ...buildCreatedAtCursorFilter(cursor),
      })
        .sort({ createdAt: -1, _id: -1 })
        .limit(limit + 1),
    );

    // Add like info to replies
    const repliesWithLikes = await Promise.all(
      replies.map(async (reply) => {
        const replyObj = reply.toObject();
        let isLiked = false;

        if (userId) {
          isLiked = await CommentLike.exists({ userId, commentId: reply._id });
        }

        return {
          ...replyObj,
          isLiked: !!isLiked,
          likeCount: replyObj.likeCount || 0,
        };
      }),
    );

    return repliesWithLikes;
  },

  // Find comment by ID with hydration
  findCommentById: async (commentId, userId = null) => {
    const comment = await populateCommentUser(Comment.findById(commentId));
    return await hydrateComment(comment, userId);
  },

  // Create a reply
  createReply: (data) => Comment.create(data),

  // Increment reply count
  incrementReplyCount: (commentId, increment) =>
    Comment.findByIdAndUpdate(
      commentId,
      { $inc: { replyCount: increment } },
      { new: true },
    ),
  // Count replies for a comment
  countReplies: (commentId) =>
    Comment.countDocuments({ parentCommentId: commentId }),

  // Comment like methods
  createCommentLike: (userId, commentId) =>
    CommentLike.create({ userId, commentId }),

  deleteCommentLike: (userId, commentId) =>
    CommentLike.findOneAndDelete({ userId, commentId }),

  isCommentLikedByUser: (userId, commentId) =>
    CommentLike.exists({ userId, commentId }),

  getCommentLikeCount: (commentId) => CommentLike.countDocuments({ commentId }),

  // Update comment
  updateComment: (commentId, userId, content) =>
    Comment.findOneAndUpdate(
      { _id: commentId, userId },
      { content },
      { new: true },
    ).populate("userId", "fullname username profilePic"),

  // Delete comment and its replies
  deleteComment: async (commentId) => {
    // Get all reply IDs first
    const replies = await Comment.find({ parentCommentId: commentId });
    const replyIds = replies.map((r) => r._id);

    // Delete all replies and their likes
    await CommentLike.deleteMany({ commentId: { $in: replyIds } });
    await Comment.deleteMany({ parentCommentId: commentId });

    // Delete the main comment and its likes
    await CommentLike.deleteMany({ commentId });
    return Comment.findByIdAndDelete(commentId);
  },

  getCommentCountByPost: (postId) =>
    Comment.countDocuments({ postId, parentCommentId: null }),

  // Existing methods (unchanged)
  createBookmark: (userId, postId) => Bookmark.create({ userId, postId }),
  deleteBookmark: (userId, postId) =>
    Bookmark.findOneAndDelete({ userId, postId }),

  findBookmarksByUser: async (userId, cursor, limit) => {
    let bookmarks = await Bookmark.find({
      userId,
      ...buildCreatedAtCursorFilter(cursor),
    })
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .populate({
        path: "postId",
        populate: { path: "authorId", select: "fullname username profilePic" },
      });
    bookmarks = bookmarks.filter((b) => b.postId); // Filter out bookmarks with missing posts
    const posts = bookmarks.map((b) => b.postId).filter(Boolean);
    const hydratedPosts = await hydratePostInteractions(posts, userId);

    return bookmarks.map((bookmark, index) => {
      const b = bookmark.toObject();
      return {
        ...b,
        postId: hydratedPosts.find(
          (p) => p._id.toString() === b.postId._id.toString(),
        ),
      };
    });
  },

  findLikedPostsByUser: async (userId, cursor, limit) => {
    let likes = await Like.find({
      userId,
      ...buildCreatedAtCursorFilter(cursor),
    })
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .populate({
        path: "postId",
        populate: { path: "authorId", select: "fullname username profilePic" },
      });
    likes = likes.filter((like) => like.postId); // Filter out likes with missing posts
    const posts = likes.map((l) => l.postId).filter(Boolean);
    const hydratedPosts = await hydratePostInteractions(posts, userId);
    return likes.map((like) => {
      const l = like.toObject();
      return {
        ...l,
        postId: hydratedPosts.find(
          (p) => p._id.toString() === l.postId._id.toString(),
        ),
      };
    });
  },
};
