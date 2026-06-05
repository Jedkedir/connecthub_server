import mongoose from "mongoose";
import { Bookmark } from "../models/Bookmark.js";
import { Comment } from "../models/Comment.js";
import { CommentLike } from "../models/CommentLike.js";
import { Like } from "../models/Like.js";
import { buildCreatedAtCursorFilter } from "../utils/pagination.js";
import { hydratePostInteractions } from "../utils/postHelper.js";
import { hydrateComment, hydrateComments } from "../utils/commentHelper.js";

/**
 * Adds the standard user projection to comment queries.
 * @param {import('mongoose').Query} query - Comment query to populate.
 * @returns {import('mongoose').Query} Populated query.
 */
const populateCommentUser = (query) => {
  return query.populate("userId", "fullname username profilePic");
};

/**
 * Encapsulates interaction persistence operations for likes, comments, and bookmarks.
 */
export const interactionRepository = {
  /**
   * Creates a post like.
   */
  createLike: (userId, postId) => Like.create({ userId, postId }),
  /**
   * Deletes a post like.
   */
  deleteLike: (userId, postId) => Like.findOneAndDelete({ userId, postId }),
  /**
   * Creates a comment document.
   */
  createComment: (data) => Comment.create(data),

  /**
   * Finds paginated top-level comments for a post and hydrates replies.
   */
  findCommentsByPost: async (postId, cursor, limit, userId = null) => {
    const comments = await populateCommentUser(
      Comment.find({
        postId,
        parentCommentId: null,
        ...buildCreatedAtCursorFilter(cursor),
      })
        .sort({ createdAt: -1, _id: -1 })
        .limit(limit + 1),
    );

    const hydratedComments = await hydrateComments(comments, userId);

    return hydratedComments;
  },

  /**
   * Finds paginated replies for a comment and adds current-user like state.
   */
  findRepliesByComment: async (commentId, cursor, limit, userId = null) => {
    const replies = await populateCommentUser(
      Comment.find({
        parentCommentId: commentId,
        ...buildCreatedAtCursorFilter(cursor),
      })
        .sort({ createdAt: -1, _id: -1 })
        .limit(limit + 1),
    );

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

  /**
   * Finds a comment by ID and hydrates replies and like state.
   */
  findCommentById: async (commentId, userId = null) => {
    const comment = await populateCommentUser(Comment.findById(commentId));
    return await hydrateComment(comment, userId);
  },

  /**
   * Creates a reply comment.
   */
  createReply: (data) => Comment.create(data),

  /**
   * Adjusts a comment's reply count.
   */
  incrementReplyCount: (commentId, increment) =>
    Comment.findByIdAndUpdate(
      commentId,
      { $inc: { replyCount: increment } },
      { new: true },
    ),
  /**
   * Counts replies for a comment.
   */
  countReplies: (commentId) =>
    Comment.countDocuments({ parentCommentId: commentId }),

  /**
   * Creates a comment like.
   */
  createCommentLike: (userId, commentId) =>
    CommentLike.create({ userId, commentId }),
  /**
   * Adjusts a comment's like count.
   */
  incrementCommentLikeCount: (commentId, amount) =>
    Comment.findByIdAndUpdate(
      commentId,
      { $inc: { likeCount: amount } },
      { new: true },
    ),
  /**
   * Deletes a comment like.
   */
  deleteCommentLike: (userId, commentId) =>
    CommentLike.findOneAndDelete({ userId, commentId }),

  /**
   * Checks whether a user liked a comment.
   */
  isCommentLikedByUser: (userId, commentId) =>
    CommentLike.exists({ userId, commentId }),

  /**
   * Counts likes for a comment.
   */
  getCommentLikeCount: (commentId) => CommentLike.countDocuments({ commentId }),

  /**
   * Updates a comment when it belongs to the supplied user.
   */
  updateComment: (commentId, userId, content) =>
    Comment.findOneAndUpdate(
      { _id: commentId, userId },
      { content },
      { new: true },
    ).populate("userId", "fullname username profilePic"),

  /**
   * Deletes a comment, its direct replies, and all related likes.
   */
  deleteComment: async (commentId) => {
    const replies = await Comment.find({ parentCommentId: commentId });
    const replyIds = replies.map((r) => r._id);

    await CommentLike.deleteMany({ commentId: { $in: replyIds } });
    await Comment.deleteMany({ parentCommentId: commentId });

    await CommentLike.deleteMany({ commentId });
    return Comment.findByIdAndDelete(commentId);
  },

  /**
   * Counts top-level comments for a post.
   */
  getCommentCountByPost: (postId) =>
    Comment.countDocuments({ postId, parentCommentId: null }),

  /**
   * Creates a bookmark.
   */
  createBookmark: (userId, postId) => Bookmark.create({ userId, postId }),
  /**
   * Deletes a bookmark.
   */
  deleteBookmark: (userId, postId) =>
    Bookmark.findOneAndDelete({ userId, postId }),

  /**
   * Finds paginated bookmarks and hydrates the referenced posts.
   */
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
    bookmarks = bookmarks.filter((b) => b.postId);
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

  /**
   * Finds paginated liked posts and hydrates the referenced posts.
   */
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
    likes = likes.filter((like) => like.postId);
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
