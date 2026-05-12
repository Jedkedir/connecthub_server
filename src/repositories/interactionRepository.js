import mongoose from "mongoose";
import { Bookmark } from '../models/Bookmark.js';
import { Comment } from '../models/Comment.js';
import { CommentLike } from '../models/CommentLike.js';
import { Like } from '../models/Like.js';
import { buildCreatedAtCursorFilter } from '../utils/pagination.js';
import { hydratePostInteractions } from "../utils/postHelper.js";

// Helper function to populate user info
const populateCommentUser = (query) => {
  return query.populate('userId', 'username profilePic');
};

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

export const interactionRepository = {
  // Existing methods
  createLike: (userId, postId) => Like.create({ userId, postId }),
  deleteLike: (userId, postId) => Like.findOneAndDelete({ userId, postId }),
  createComment: (data) => Comment.create(data),
  
  // Updated findCommentsByPost with hydration
  findCommentsByPost: async (postId, cursor, limit, userId = null) => {
    const comments = await populateCommentUser(
      Comment.find({
        postId,
        parentCommentId: null, // Only get top-level comments
        ...buildCreatedAtCursorFilter(cursor)
      })
        .sort({ createdAt: -1, _id: -1 })
        .limit(limit + 1)
    );
    
    // Hydrate comments with their replies
    const hydratedComments = await hydrateComments(comments, userId);
    
    return hydratedComments;
  },
  
  // New method: Find replies for a specific comment
  findRepliesByComment: async (commentId, cursor, limit, userId = null) => {
    const replies = await populateCommentUser(
      Comment.find({
        parentCommentId: commentId,
        ...buildCreatedAtCursorFilter(cursor)
      })
        .sort({ createdAt: -1, _id: -1 })
        .limit(limit + 1)
    );
    
    // Add like info to replies
    const repliesWithLikes = await Promise.all(
      replies.map(async (reply) => {
        const replyObj = reply.toObject();
        let isLiked = false;
        
        if (userId) {
          isLiked = await CommentLike.exists({ userId, commentId: reply._id });
        }
        
        return {
          ...replyObj,
          isLiked: !!isLiked,
          likeCount: replyObj.likeCount || 0
        };
      })
    );
    
    return repliesWithLikes;
  },
  
  // Find comment by ID with hydration
  findCommentById: async (commentId, userId = null) => {
    const comment = await populateCommentUser(Comment.findById(commentId));
    console.log('Found comment:', comment);
    return await hydrateComment(comment, userId);
  },
  
  // Create a reply
  createReply: (data) => Comment.create(data),
  
  // Increment reply count
  incrementReplyCount: (commentId, increment) =>
    Comment.findByIdAndUpdate(
      commentId,
      { $inc: { replyCount: increment } },
      { new: true }
    ),
  
  // Comment like methods
  createCommentLike: (userId, commentId) => CommentLike.create({ userId, commentId }),
  
  deleteCommentLike: (userId, commentId) => CommentLike.findOneAndDelete({ userId, commentId }),
  
  isCommentLikedByUser: (userId, commentId) => 
    CommentLike.exists({ userId, commentId }),
  
  getCommentLikeCount: (commentId) => CommentLike.countDocuments({ commentId }),
  
  // Update comment
  updateComment: (commentId, userId, content) =>
    Comment.findOneAndUpdate(
      { _id: commentId, userId },
      { content },
      { new: true }
    ).populate('userId', 'username profilePic'),
  
  // Delete comment and its replies
  deleteComment: async (commentId) => {
    // Get all reply IDs first
    const replies = await Comment.find({ parentCommentId: commentId });
    const replyIds = replies.map(r => r._id);
    
    // Delete all replies and their likes
    await CommentLike.deleteMany({ commentId: { $in: replyIds } });
    await Comment.deleteMany({ parentCommentId: commentId });
    
    // Delete the main comment and its likes
    await CommentLike.deleteMany({ commentId });
    return Comment.findByIdAndDelete(commentId);
  },
  
  getCommentCountByPost: (postId) => 
    Comment.countDocuments({ postId, parentCommentId: null }),
  
  // Existing methods (unchanged)
  createBookmark: (userId, postId) => Bookmark.create({ userId, postId }),
  deleteBookmark: (userId, postId) => Bookmark.findOneAndDelete({ userId, postId }),
  
  findBookmarksByUser: async (userId, cursor, limit) => {
    const bookmarks = await Bookmark.find({ userId, ...buildCreatedAtCursorFilter(cursor) })
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .populate({
        path: 'postId',
        populate: { path: 'authorId', select: 'username profilePic' }
      });

    const posts = bookmarks.map(b => b.postId).filter(Boolean);
    const hydratedPosts = await hydratePostInteractions(posts, userId);

    return bookmarks.map((bookmark, index) => {
      const b = bookmark.toObject();
      return {
        ...b,
        postId: hydratedPosts.find(p => p._id.toString() === b.postId._id.toString())
      };
    });
  },
  
  findLikedPostsByUser: async (userId, cursor, limit) => {
    const likes = await Like.find({ userId, ...buildCreatedAtCursorFilter(cursor) })
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .populate({
        path: 'postId',
        populate: { path: 'authorId', select: 'username profilePic' }
      });

    const posts = likes.map(l => l.postId).filter(Boolean);
    const hydratedPosts = await hydratePostInteractions(posts, userId);

    return likes.map(like => {
      const l = like.toObject();
      return {
        ...l,
        postId: hydratedPosts.find(p => p._id.toString() === l.postId._id.toString())
      };
    });
  }
};