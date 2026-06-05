import {
  createDomainEvent,
  NOTIFICATION_EVENTS,
  eventBus,
} from "../events/eventBus.js";
import { interactionRepository } from "../repositories/interactionRepository.js";
import { postRepository } from "../repositories/postRepository.js";
import { userRepository } from "../repositories/userRepository.js";
import { AppError } from "../utils/AppError.js";
import { getCreatedAtCursorFromDoc, getLimit } from "../utils/pagination.js";
import { postService } from "./postService.js";

/**
 * Loads a post or raises the API not-found error.
 * @param {string} postId - Post ID.
 * @returns {Promise<Object>} Post document.
 */
const ensurePost = async (postId) => {
  const post = await postRepository.findByIdRaw(postId);
  if (!post) throw new AppError("POST_NOT_FOUND", "Post not found.", 404);
  return post;
};

/**
 * Loads a comment or raises the API not-found error.
 * @param {string} commentId - Comment ID.
 * @returns {Promise<Object>} Hydrated comment.
 */
const ensureComment = async (commentId) => {
  const comment = await interactionRepository.findCommentById(commentId);
  if (!comment)
    throw new AppError("COMMENT_NOT_FOUND", "Comment not found.", 404);
  return comment;
};

/**
 * Detects MongoDB duplicate-key errors from unique indexes.
 * @param {Error} error - Error thrown by Mongoose or MongoDB.
 * @returns {boolean} True when the error is a duplicate-key conflict.
 */
const isDuplicateKey = (error) => error?.code === 11000;

/**
 * Adds current-user like state to a list of comments.
 * @param {Object[]} comments - Comments to enrich.
 * @param {string} userId - Current user ID.
 * @returns {Promise<Object[]>} Comments with isLiked flags.
 */
const addLikeState = async (comments, userId) => {
  return Promise.all(
    comments.map(async (comment) => {
      const liked = await interactionRepository.isCommentLikedByUser(
        userId,
        comment._id,
      );
      return {
        ...comment,
        isLiked: Boolean(liked),
      };
    }),
  );
};

/**
 * Normalizes mention strings to unique lowercase usernames.
 * @param {string[]|undefined} mentions - Raw mention list.
 * @returns {string[]} Unique normalized usernames.
 */
const normalizeMentions = (mentions) => {
  if (!Array.isArray(mentions)) return [];
  return [
    ...new Set(
      mentions
        .map((mention) =>
          String(mention).trim().toLowerCase().replace(/^@/, ""),
        )
        .filter(Boolean),
    ),
  ];
};

/**
 * Contains interaction business operations for posts, comments, likes, and bookmarks.
 */
export const interactionService = {
  /**
   * Creates a post like, handles duplicate likes, emits a notification, and increments counts.
   */
  likePost: async (userId, postId) => {
    const post = await ensurePost(postId);

    try {
      await interactionRepository.createLike(userId, postId);
    } catch (error) {
      if (isDuplicateKey(error)) {
        throw new AppError(
          "LIKE_ALREADY_EXISTS",
          "Post is already liked.",
          409,
        );
      }
      throw error;
    }

    eventBus.emit(
      NOTIFICATION_EVENTS.POST_LIKED,
      createDomainEvent(NOTIFICATION_EVENTS.POST_LIKED, {
        senderId: userId,
        recipientId: post.authorId,
        postId,
      }),
    );

    return postRepository.increment(postId, "likesCount", 1);
  },

  /**
   * Removes a post like and decrements the post like count.
   */
  unlikePost: async (userId, postId) => {
    await ensurePost(postId);
    const deleted = await interactionRepository.deleteLike(userId, postId);
    if (!deleted) {
      throw new AppError(
        "LIKE_NOT_FOUND",
        "Post is not liked by this user.",
        404,
      );
    }

    return postRepository.increment(postId, "likesCount", -1);
  },

  /**
   * Adds a top-level comment or first-level reply and emits relevant notifications.
   */
  addComment: async (userId, postId, payload) => {
    const post = await ensurePost(postId);
    const parentCommentId = payload.parentCommentId || null;
    let parentComment = null;

    if (parentCommentId) {
      parentComment = await ensureComment(parentCommentId);
      if (parentComment.postId.toString() !== postId.toString()) {
        throw new AppError(
          "INVALID_PARENT_COMMENT",
          "Parent comment does not belong to this post.",
          400,
        );
      }
      if (parentComment.parentCommentId) {
        throw new AppError(
          "NESTED_REPLIES_NOT_SUPPORTED",
          "Replies can only be added to top-level comments.",
          400,
        );
      }
    }

    const comment = await interactionRepository.createComment({
      userId,
      postId,
      content: payload.content,
      parentCommentId,
    });

    if (parentComment) {
      await interactionRepository.incrementReplyCount(parentComment._id, 1);
      eventBus.emit(
        NOTIFICATION_EVENTS.COMMENT_REPLIED,
        createDomainEvent(NOTIFICATION_EVENTS.COMMENT_REPLIED, {
          senderId: userId,
          recipientId: parentComment.userId,
          postId,
          commentId: comment._id,
        }),
      );
    } else {
      eventBus.emit(
        NOTIFICATION_EVENTS.POST_COMMENTED,
        createDomainEvent(NOTIFICATION_EVENTS.POST_COMMENTED, {
          senderId: userId,
          recipientId: post.authorId,
          postId,
          commentId: comment._id,
        }),
      );
    }

    const mentions = normalizeMentions(payload.mentions);
    if (mentions.length > 0) {
      const mentionedUsers = await userRepository.findByUsernames(mentions);
      for (const mentionedUser of mentionedUsers) {
        eventBus.emit(
          NOTIFICATION_EVENTS.COMMENT_MENTIONED,
          createDomainEvent(NOTIFICATION_EVENTS.COMMENT_MENTIONED, {
            senderId: userId,
            recipientId: mentionedUser._id,
            postId,
            commentId: comment._id,
          }),
        );
      }
    }

    await postRepository.increment(postId, "commentsCount", 1);
    return comment.populate("userId", "fullname profilePic");
  },

  /**
   * Returns paginated top-level comments for a post with like metadata.
   */
  getComments: async (userId, postId, query) => {
    await ensurePost(postId);
    const limit = getLimit(query.limit);
    const comments = await interactionRepository.findCommentsByPost(
      postId,
      query.cursor,
      limit,
      userId,
    );
    const commentsWithMeta = await addLikeState(comments, userId);
    return postService.toPaginationResult(
      commentsWithMeta,
      limit,
      getCreatedAtCursorFromDoc,
    );
  },

  /**
   * Returns paginated replies for a comment with like metadata.
   */
  getReplies: async (commentId, query, userId) => {
    await ensureComment(commentId);
    const limit = getLimit(query.limit);
    const replies = await interactionRepository.findRepliesByComment(
      commentId,
      query.cursor,
      limit,
    );
    const repliesWithMeta = await addLikeState(replies, userId);
    return postService.toPaginationResult(
      repliesWithMeta,
      limit,
      getCreatedAtCursorFromDoc,
    );
  },

  /**
   * Creates a comment like, emits a notification, and returns updated like state.
   */
  likeComment: async (userId, commentId) => {
    const comment = await ensureComment(commentId);

    try {
      await interactionRepository.createCommentLike(userId, commentId);
    } catch (error) {
      if (isDuplicateKey(error)) {
        throw new AppError(
          "COMMENT_LIKE_ALREADY_EXISTS",
          "Comment is already liked.",
          409,
        );
      }
      throw error;
    }

    const updatedComment =
      await interactionRepository.incrementCommentLikeCount(commentId, 1);
    console.log("liked Comment",updatedComment)
    eventBus.emit(
      NOTIFICATION_EVENTS.COMMENT_LIKED,
      createDomainEvent(NOTIFICATION_EVENTS.COMMENT_LIKED, {
        senderId: userId,
        recipientId: comment.userId,
        postId: comment.postId,
        commentId,
      }),
    );

    return { likeCount: updatedComment.likeCount, isLiked: true };
  },

  /**
   * Removes a comment like and returns updated like state.
   */
  unlikeComment: async (userId, commentId) => {
    await ensureComment(commentId);
    const deleted = await interactionRepository.deleteCommentLike(
      userId,
      commentId,
    );
    if (!deleted) {
      throw new AppError(
        "COMMENT_LIKE_NOT_FOUND",
        "Comment is not liked by this user.",
        404,
      );
    }

    const updatedComment =
      await interactionRepository.incrementCommentLikeCount(commentId, -1);
    console.log("Unliked Comment",updatedComment)
    return { likeCount: updatedComment.likeCount, isLiked: false };
  },

  /**
   * Updates a comment when the authenticated user is its author.
   */
  updateComment: async (userId, commentId, content) => {
    const comment = await interactionRepository.updateComment(
      commentId,
      userId,
      content,
    );
    if (!comment) {
      throw new AppError(
        "COMMENT_NOT_FOUND_OR_FORBIDDEN",
        "Comment not found or you are not the author.",
        404,
      );
    }
    return comment;
  },

  /**
   * Deletes an owned comment, its replies when needed, and updates counters.
   */
  deleteComment: async (userId, commentId) => {
    const comment = await ensureComment(commentId);
    if (comment.userId._id.toString() !== userId.toString()) {
      throw new AppError(
        "FORBIDDEN",
        "You can only delete your own comments.",
        403,
      );
    }

    const replyCount = comment.parentCommentId
      ? 0
      : await interactionRepository.countReplies(comment._id);
    const deletedCount = 1 + replyCount;

    await interactionRepository.deleteComment(comment._id);
    await postRepository.increment(
      comment.postId,
      "commentsCount",
      -deletedCount,
    );

    if (comment.parentCommentId) {
      await interactionRepository.incrementReplyCount(
        comment.parentCommentId,
        -1,
      );
    }

    return { deleted: true, deletedCount };
  },

  /**
   * Creates a bookmark and increments the post bookmark count.
   */
  bookmarkPost: async (userId, postId) => {
    await ensurePost(postId);

    try {
      await interactionRepository.createBookmark(userId, postId);
    } catch (error) {
      if (isDuplicateKey(error)) {
        throw new AppError(
          "BOOKMARK_ALREADY_EXISTS",
          "Post is already bookmarked.",
          409,
        );
      }
      throw error;
    }

    return postRepository.increment(postId, "bookmarksCount", 1);
  },

  /**
   * Removes a bookmark and decrements the post bookmark count.
   */
  unbookmarkPost: async (userId, postId) => {
    await ensurePost(postId);
    const deleted = await interactionRepository.deleteBookmark(userId, postId);
    if (!deleted) {
      throw new AppError("BOOKMARK_NOT_FOUND", "Bookmark does not exist.", 404);
    }

    return postRepository.increment(postId, "bookmarksCount", -1);
  },

  /**
   * Returns paginated bookmarks for a user.
   */
  getBookmarks: async (userId, query) => {
    const limit = getLimit(query.limit);
    const bookmarks = await interactionRepository.findBookmarksByUser(
      userId,
      query.cursor,
      limit,
    );
    return postService.toPaginationResult(bookmarks, limit, (bookmark) =>
      getCreatedAtCursorFromDoc(bookmark),
    );
  },

  /**
   * Returns paginated posts liked by a user.
   */
  getLikedPosts: async (userId, query) => {
    const limit = getLimit(query.limit);
    const likedPosts = await interactionRepository.findLikedPostsByUser(
      userId,
      query.cursor,
      limit,
    );
    return postService.toPaginationResult(likedPosts, limit, (like) =>
      getCreatedAtCursorFromDoc(like),
    );
  },
};
