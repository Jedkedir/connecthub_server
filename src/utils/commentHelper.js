import mongoose from "mongoose";
import { Comment } from "../models/Comment.js";
export const hydrateComment = async (comment) => {
  if (!comment) return comment;
  console.log('Hydrating comment:', comment);
  const commentObj = comment.toObject ? comment.toObject() : comment;
  const replies = await Comment.find({ parentCommentId: comment._id }).sort({ createdAt: -1 });

   return {...commentObj, replies };
}
