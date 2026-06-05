import { followRepository } from "../repositories/followRepository.js";
import { feedRepository } from "../repositories/feedRepository.js";
import { decodeCursor, encodeCursor, getLimit } from "../utils/pagination.js";
import { postService } from "./postService.js";

/**
 * Builds a cursor for the ranked global feed.
 * @param {Object|null} post - Last visible post from the page.
 * @returns {string|null} Encoded cursor.
 */
const buildGlobalCursor = (post) => {
  if (!post) return null;
  return encodeCursor({
    score: post.score,
    createdAt: post.createdAt,
    id: post._id,
  });
};

/**
 * Contains feed and exploration business operations.
 */
export const feedService = {
  /**
   * Returns recent posts from users followed by the authenticated user.
   */
  personalized: async (userId, query) => {
    const limit = getLimit(query.limit);
    const followingIds = await followRepository.findFollowingIds(userId);
    if (followingIds.length === 0) {
      return { data: [], pageInfo: { hasMore: false, nextCursor: null } };
    }

    const posts = await feedRepository.findRecent(
      userId,
      { authorId: { $in: followingIds } },
      query.cursor,
      limit,
    );

    return postService.toPaginationResult(posts, limit);
  },

  /**
   * Returns ranked global posts using score and cursor pagination.
   */
  global: async (userId, query) => {
    const limit = getLimit(query.limit);
    const cursor = decodeCursor(query.cursor);
    const posts = await feedRepository.aggregateGlobalFeed(
      userId,
      cursor,
      limit,
    );
    return postService.toPaginationResult(posts, limit, buildGlobalCursor);
  },

  /**
   * Explores posts by username, topic, content search, or recent posts.
   * @param {string} userId - ID of the user making the request.
   * @param {Object} query - Search and pagination query parameters.
   * @returns {Promise<Object>} Paginated feed result with optional user context.
   */
  explore: async (userId, query) => {
    const limit = getLimit(query.limit);
    const cursor = query.cursor;

    if (query.user) {
      const result = await feedRepository.findByUsername(
        userId,
        query.user,
        cursor,
        limit,
      );
      if (!result.user) {
        return { data: [], pageInfo: { hasMore: false, nextCursor: null } };
      }

      const pagination = postService.toPaginationResult(result.posts, limit);
      return {
        ...pagination,
        user: result.user,
      };
    }

    if (query.topic) {
      const posts = await feedRepository.findByTopic(
        userId,
        query.topic,
        cursor,
        limit,
      );
      return postService.toPaginationResult(posts, limit);
    }

    const searchQuery = query.content ?? query.q ?? "";
    const posts = await feedRepository.findByContent(
      userId,
      searchQuery,
      cursor,
      limit,
    );
    return postService.toPaginationResult(posts, limit);
  },
};
