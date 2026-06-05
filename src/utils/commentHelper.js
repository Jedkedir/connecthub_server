import mongoose from "mongoose";
import { Comment } from "../models/Comment.js";
import { CommentLike } from "../models/CommentLike.js";

/**
 * Adds reply and like metadata to a single comment document.
 * @param {Object|null} comment - Mongoose comment document or plain comment object.
 * @param {string|null} [userId=null] - Current user used to compute like state.
 * @returns {Promise<Object|null>} Hydrated comment with replies, counts, and like flags.
 */
export const hydrateComment = async (comment, userId = null) => {
  if (!comment) return comment;

  const commentObj = comment.toObject ? comment.toObject() : comment;

  const replies = await Comment.find({ parentCommentId: comment._id })
    .sort({ createdAt: -1 })
    .populate("userId", "fullname profilePic")
    .lean();

  const hydratedReplies = await Promise.all(
    replies.map(async (reply) => {
      const replyWithLikes = { ...reply };

      if (userId) {
        const isLiked = await CommentLike.exists({
          userId,
          commentId: reply._id,
        });
        replyWithLikes.isLiked = !!isLiked;
      }

      return replyWithLikes;
    }),
  );

  const likeCount = commentObj.likeCount || 0;
  let isLiked = false;

  if (userId) {
    const userLike = await CommentLike.exists({
      userId,
      commentId: comment._id,
    });
    isLiked = !!userLike;
  }

  return {
    ...commentObj,
    likeCount,
    isLiked,
    replyCount: hydratedReplies.length,
    replies: hydratedReplies,
  };
};

/**
 * Adds reply and like metadata to a list of comments in batched queries.
 * @param {Object[]} comments - Comment documents or plain comment objects.
 * @param {string|null} [userId=null] - Current user used to compute like state.
 * @returns {Promise<Object[]>} Hydrated comments with nested replies.
 */
export const hydrateComments = async (comments, userId = null) => {
  if (!comments || comments.length === 0) return [];

  const commentIds = comments.map((c) => c._id);

  const allReplies = await Comment.find({
    parentCommentId: { $in: commentIds },
  })
    .sort({ createdAt: -1 })
    .populate("userId", "fullname profilePic")
    .lean();

  const repliesByParentId = {};
  allReplies.forEach((reply) => {
    const parentId = reply.parentCommentId.toString();
    if (!repliesByParentId[parentId]) {
      repliesByParentId[parentId] = [];
    }
    repliesByParentId[parentId].push(reply);
  });

  let likesByCommentId = {};
  if (userId) {
    const allLikes = await CommentLike.find({
      commentId: { $in: [...commentIds, ...allReplies.map((r) => r._id)] },
      userId,
    }).lean();

    likesByCommentId = {};
    allLikes.forEach((like) => {
      likesByCommentId[like.commentId.toString()] = true;
    });
  }

  return comments.map((comment) => {
    const commentObj = comment.toObject ? comment.toObject() : comment;
    const replies = repliesByParentId[comment._id.toString()] || [];

    return {
      ...commentObj,
      likeCount: commentObj.likeCount || 0,
      isLiked: likesByCommentId[comment._id.toString()] || false,
      replyCount: replies.length,
      replies: replies.map((reply) => ({
        ...reply,
        likeCount: reply.likeCount || 0,
        isLiked: likesByCommentId[reply._id.toString()] || false,
      })),
    };
  });
};
