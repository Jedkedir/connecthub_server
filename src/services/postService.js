import { postRepository } from "../repositories/postRepository.js";
import { userRepository } from "../repositories/userRepository.js";
import {
  createDomainEvent,
  NOTIFICATION_EVENTS,
  eventBus,
} from "../events/eventBus.js";
import { AppError } from "../utils/AppError.js";
import { getCreatedAtCursorFromDoc, getLimit } from "../utils/pagination.js";

/**
 * Shapes limit-plus-one query results into data and pageInfo.
 * @param {Object[]} items - Query results containing up to limit + 1 rows.
 * @param {number} limit - Requested page size.
 * @param {Function} [cursorFactory=getCreatedAtCursorFromDoc] - Cursor builder for the last visible row.
 * @returns {{data: Object[], pageInfo: {hasMore: boolean, nextCursor: string|null}}} Paginated response.
 */
const toPaginationResult = (
  items,
  limit,
  cursorFactory = getCreatedAtCursorFromDoc,
) => {
  const hasMore = items.length > limit;
  const data = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore ? cursorFactory(data[data.length - 1]) : null;
  return { data, pageInfo: { hasMore, nextCursor } };
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
 * Contains post creation, lookup, deletion, and timeline operations.
 */
export const postService = {
  /**
   * Creates a post, normalizes topics, and emits mention notifications.
   * @param {string} authorId - Authenticated author's user ID.
   * @param {Object} payload - Post creation payload.
   * @returns {Promise<Object>} Created post.
   */
  createPost: async (authorId, payload) => {
    const post = await postRepository.create({
      authorId,
      content: payload.content,
      mediaUrls: payload.mediaUrls || [],
      topics: Array.isArray(payload.topics)
        ? payload.topics
            .map((topic) =>
              String(topic).trim().toLowerCase().replace(/^#/, ""),
            )
            .filter(Boolean)
        : payload.topic
          ? [
              String(payload.topic).trim().toLowerCase().replace(/^#/, ""),
            ].filter(Boolean)
          : [],
    });

    const mentions = normalizeMentions(payload.mentions);
    if (mentions.length > 0) {
      const mentionedUsers = await userRepository.findByUsernames(mentions);
      for (const mentionedUser of mentionedUsers) {
        eventBus.emit(
          NOTIFICATION_EVENTS.POST_MENTIONED,
          createDomainEvent(NOTIFICATION_EVENTS.POST_MENTIONED, {
            senderId: authorId,
            recipientId: mentionedUser._id,
            postId: post._id,
          }),
        );
      }
    }

    return post;
  },

  /**
   * Records a view and returns a hydrated post.
   * @param {string} userId - Authenticated user ID.
   * @param {string} postId - Post ID.
   * @returns {Promise<Object>} Hydrated post.
   */
  getPost: async (userId, postId) => {
    const post = await postRepository.incrementView(postId);
    if (!post) throw new AppError("POST_NOT_FOUND", "Post not found.", 404);
    return postRepository.findById(userId, postId);
  },

  /**
   * Deletes a post after verifying ownership.
   * @param {string} userId - Authenticated user ID.
   * @param {string} postId - Post ID.
   * @returns {Promise<{deleted: boolean}>} Deletion result.
   */
  deletePost: async (userId, postId) => {
    const post = await postRepository.findByIdRaw(postId);
    if (!post) throw new AppError("POST_NOT_FOUND", "Post not found.", 404);

    if (post.authorId.toString() !== userId.toString()) {
      throw new AppError(
        "FORBIDDEN",
        "You can only delete your own posts.",
        403,
      );
    }

    await postRepository.deleteById(postId);
    return { deleted: true };
  },

  /**
   * Returns paginated posts for a specific author.
   * @param {string} currentUserId - Authenticated user ID.
   * @param {string} userId - Author user ID.
   * @param {Object} query - Pagination query.
   * @returns {Promise<Object>} Paginated post result.
   */
  getPostsByUser: async (currentUserId, userId, query) => {
    const limit = getLimit(query.limit);
    const rows = await postRepository.findByUser(
      currentUserId,
      userId,
      query.cursor,
      limit,
    );
    return toPaginationResult(rows, limit);
  },
  toPaginationResult,
};
