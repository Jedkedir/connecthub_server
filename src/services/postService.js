import { postRepository } from "../repositories/postRepository.js";
import { userRepository } from "../repositories/userRepository.js";
import {
  createDomainEvent,
  NOTIFICATION_EVENTS,
  eventBus,
} from "../events/eventBus.js";
import { AppError } from "../utils/AppError.js";
import { getCreatedAtCursorFromDoc, getLimit } from "../utils/pagination.js";

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

export const postService = {
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

  getPost: async (userId, postId) => {
    const post = await postRepository.incrementView(postId);
    if (!post) throw new AppError("POST_NOT_FOUND", "Post not found.", 404);
    return postRepository.findById(userId, postId);
  },

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
