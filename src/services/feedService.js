import { followRepository } from "../repositories/followRepository.js";
import { feedRepository } from "../repositories/feedRepository.js";
import { decodeCursor, encodeCursor, getLimit } from "../utils/pagination.js";
import { postService } from "./postService.js";

const buildGlobalCursor = (post) => {
  if (!post) return null;
  return encodeCursor({
    score: post.score,
    createdAt: post.createdAt,
    id: post._id,
  });
};

export const feedService = {
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
   * Explore posts based on a search query. If no query is provided, it returns recent posts.
   * @param {string} userId - The ID of the user making the request.
   * @param {Object} query - The query parameters. query.user or query.topic or query.content is the search term, query.cursor is the pagination cursor, and query.limit is the number of items to return.
   * @returns {Object} - An object containing the data and pageInfo properties.
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
