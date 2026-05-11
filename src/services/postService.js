import { postRepository } from '../repositories/postRepository.js';
import { AppError } from '../utils/AppError.js';
import { getCreatedAtCursorFromDoc, getLimit } from '../utils/pagination.js';

const toPaginationResult = (items, limit, cursorFactory = getCreatedAtCursorFromDoc) => {
  const hasMore = items.length > limit;
  const data = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore ? cursorFactory(data[data.length - 1]) : null;
  return { data, pageInfo: { hasMore, nextCursor } };
};

export const postService = {
  createPost: (authorId, payload) =>
    postRepository.create({
      authorId,
      content: payload.content,
      mediaUrls: payload.mediaUrls || []
    }),

  getPost: async (userId, postId) => {
    const post = await postRepository.incrementView(postId);
    if (!post) throw new AppError('POST_NOT_FOUND', 'Post not found.', 404);
    return postRepository.findById(userId, postId);
  },

  deletePost: async (userId, postId) => {
    const post = await postRepository.findByIdRaw(postId);
    if (!post) throw new AppError('POST_NOT_FOUND', 'Post not found.', 404);

    if (post.authorId.toString() !== userId.toString()) {
      throw new AppError('FORBIDDEN', 'You can only delete your own posts.', 403);
    }

    await postRepository.deleteById(postId);
    return { deleted: true };
  },

  getPostsByUser: async (currentUserId, userId, query) => {
    const limit = getLimit(query.limit);
    const rows = await postRepository.findByUser(currentUserId,userId, query.cursor, limit);
    return toPaginationResult(rows, limit);
  },
  toPaginationResult
};
