import { followRepository } from '../repositories/followRepository.js';
import { postRepository } from '../repositories/postRepository.js';
import {
  buildCreatedAtCursorFilter,
  decodeCursor,
  encodeCursor,
  getLimit
} from '../utils/pagination.js';
import { postService } from './postService.js';

const buildGlobalCursor = (post) => {
  if (!post) return null;
  return encodeCursor({
    score: post.score,
    createdAt: post.createdAt,
    id: post._id
  });
};

export const feedService = {
  personalized: async (userId, query) => {
    const limit = getLimit(query.limit);
    const followingIds = await followRepository.findFollowingIds(userId);
    if (followingIds.length === 0) {
      return { data: [], pageInfo: { hasMore: false, nextCursor: null } };
    }

    const posts = await postRepository.findRecent(userId,
      {
        authorId: { $in: followingIds },
        ...buildCreatedAtCursorFilter(query.cursor)
      },
      limit
    );

    return postService.toPaginationResult(posts, limit);
  },

  global: async (userId, query) => {
    const limit = getLimit(query.limit);
    const cursor = decodeCursor(query.cursor);
    const posts = await postRepository.aggregateGlobalFeed(userId,cursor, limit);
    return postService.toPaginationResult(posts, limit, buildGlobalCursor);
  },

  explore: async (userId, query) => {
    const limit = getLimit(query.limit);
    const posts = await postRepository.findExplore(userId, query.q, query.cursor, limit);
    return postService.toPaginationResult(posts, limit);
  }
};
