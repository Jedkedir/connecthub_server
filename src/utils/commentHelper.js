import mongoose from "mongoose";
import { Comment } from "../models/Comment.js";
import { CommentLike } from "../models/CommentLike.js";
// Helper function to hydrate a single comment with its replies
export const hydrateComment = async (comment, userId = null) => {
  if (!comment) return comment;
  
  const commentObj = comment.toObject ? comment.toObject() : comment;
  
  // Get replies for this comment
  const replies = await Comment.find({ parentCommentId: comment._id })
    .sort({ createdAt: -1 })
    .populate('userId', 'username profilePic')
    .lean();
  
  // Hydrate each reply recursively (if you want nested replies, but usually replies don't have replies)
  const hydratedReplies = await Promise.all(
    replies.map(async (reply) => {
      const replyWithLikes = { ...reply };
      
      // Add like info if userId is provided
      if (userId) {
        const isLiked = await CommentLike.exists({ userId, commentId: reply._id });
        replyWithLikes.isLiked = !!isLiked;
      }
      
      return replyWithLikes;
    })
  );
  
  // Add like info for the main comment if userId is provided
  let likeCount = commentObj.likeCount || 0;
  let isLiked = false;
  
  if (userId) {
    const userLike = await CommentLike.exists({ userId, commentId: comment._id });
    isLiked = !!userLike;
  }
  
  return {
    ...commentObj,
    likeCount,
    isLiked,
    replyCount: hydratedReplies.length,
    replies: hydratedReplies
  };
};



// Helper function to hydrate multiple comments
export const hydrateComments = async (comments, userId = null) => {
  if (!comments || comments.length === 0) return [];
  
  const commentIds = comments.map(c => c._id);
  
  // Batch fetch all replies for these comments
  const allReplies = await Comment.find({ 
    parentCommentId: { $in: commentIds } 
  })
    .sort({ createdAt: -1 })
    .populate('userId', 'username profilePic')
    .lean();
  
  // Group replies by parent comment ID
  const repliesByParentId = {};
  allReplies.forEach(reply => {
    const parentId = reply.parentCommentId.toString();
    if (!repliesByParentId[parentId]) {
      repliesByParentId[parentId] = [];
    }
    repliesByParentId[parentId].push(reply);
  });
  
  // Batch fetch all comment likes if userId is provided
  let likesByCommentId = {};
  if (userId) {
    const allLikes = await CommentLike.find({ 
      commentId: { $in: [...commentIds, ...allReplies.map(r => r._id)] },
      userId 
    }).lean();
    
    likesByCommentId = {};
    allLikes.forEach(like => {
      likesByCommentId[like.commentId.toString()] = true;
    });
  }
  
  // Hydrate each comment
  return comments.map(comment => {
    const commentObj = comment.toObject ? comment.toObject() : comment;
    const replies = repliesByParentId[comment._id.toString()] || [];
    
    return {
      ...commentObj,
      likeCount: commentObj.likeCount || 0,
      isLiked: likesByCommentId[comment._id.toString()] || false,
      replyCount: replies.length,
      replies: replies.map(reply => ({
        ...reply,
        likeCount: reply.likeCount || 0,
        isLiked: likesByCommentId[reply._id.toString()] || false
      }))
    };
  });
};