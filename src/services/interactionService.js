import { createDomainEvent, NOTIFICATION_EVENTS, eventBus } from '../events/eventBus.js';
import { interactionRepository } from '../repositories/interactionRepository.js';
import { postRepository } from '../repositories/postRepository.js';
import { AppError } from '../utils/AppError.js';
import { getCreatedAtCursorFromDoc, getLimit } from '../utils/pagination.js';
import { postService } from './postService.js';

const ensurePost = async (postId) => {
  const post = await postRepository.findByIdRaw(postId);
  if (!post) throw new AppError('POST_NOT_FOUND', 'Post not found.', 404);
  return post;
};

const isDuplicateKey = (error) => error?.code === 11000;

export const interactionService = {
  likePost: async (userId, postId) => {
    const post = await ensurePost(postId);

    try {
      await interactionRepository.createLike(userId, postId);
    } catch (error) {
      if (isDuplicateKey(error)) {
        throw new AppError('LIKE_ALREADY_EXISTS', 'Post is already liked.', 409);
      }
      throw error;
    }

    eventBus.emit(
      NOTIFICATION_EVENTS.POST_LIKED,
      createDomainEvent(NOTIFICATION_EVENTS.POST_LIKED, {
        senderId: userId,
        recipientId: post.authorId,
        postId
      })
    );

    return postRepository.increment(postId, 'likesCount', 1);
  },

  unlikePost: async (userId, postId) => {
    await ensurePost(postId);
    const deleted = await interactionRepository.deleteLike(userId, postId);
    if (!deleted) {
      throw new AppError('LIKE_NOT_FOUND', 'Post is not liked by this user.', 404);
    }

    return postRepository.increment(postId, 'likesCount', -1);
  },

  addComment: async (userId, postId, payload) => {
    const post = await ensurePost(postId);
    const comment = await interactionRepository.createComment({
      userId,
      postId,
      content: payload.content
    });

    eventBus.emit(
      NOTIFICATION_EVENTS.POST_COMMENTED,
      createDomainEvent(NOTIFICATION_EVENTS.POST_COMMENTED, {
        senderId: userId,
        recipientId: post.authorId,
        postId,
        commentId: comment._id
      })
    );

    await postRepository.increment(postId, 'commentsCount', 1);
    return comment.populate('userId', 'username profilePic');
  },

  getComments: async (postId, query) => {
    await ensurePost(postId);
    const limit = getLimit(query.limit);
    const comments = await interactionRepository.findCommentsByPost(postId, query.cursor, limit);
    return postService.toPaginationResult(comments, limit);
  },

  bookmarkPost: async (userId, postId) => {
    await ensurePost(postId);

    try {
      await interactionRepository.createBookmark(userId, postId);
    } catch (error) {
      if (isDuplicateKey(error)) {
        throw new AppError('BOOKMARK_ALREADY_EXISTS', 'Post is already bookmarked.', 409);
      }
      throw error;
    }

    return postRepository.increment(postId, 'bookmarksCount', 1);
  },

  unbookmarkPost: async (userId, postId) => {
    await ensurePost(postId);
    const deleted = await interactionRepository.deleteBookmark(userId, postId);
    if (!deleted) {
      throw new AppError('BOOKMARK_NOT_FOUND', 'Bookmark does not exist.', 404);
    }

    return postRepository.increment(postId, 'bookmarksCount', -1);
  },

  getBookmarks: async (userId, query) => {
    const limit = getLimit(query.limit);
    const bookmarks = await interactionRepository.findBookmarksByUser(userId, query.cursor, limit);
    return postService.toPaginationResult(bookmarks, limit, (bookmark) =>
      getCreatedAtCursorFromDoc(bookmark)
    );
  }
};
