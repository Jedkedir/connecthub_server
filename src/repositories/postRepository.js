import { Post } from "../models/Post.js";
import { buildCreatedAtCursorFilter } from "../utils/pagination.js";
import mongoose from "mongoose";
import { hydratePostInteractions } from "../utils/postHelper.js";

export const postRepository = {
  create: (data) => Post.create(data),
  findById: async (userId, id) => {
    const post = await Post.findById(id).populate(
      "authorId",
      "fullname profilePic bio",
    );
    if (!post) return null;
    const hydrated = await hydratePostInteractions([post], userId);
    return hydrated[0];
  },
  findByIdRaw: (id) => Post.findById(id),
  deleteById: (id) => Post.findByIdAndDelete(id),
  increment: (id, field, amount) =>
    Post.findByIdAndUpdate(id, { $inc: { [field]: amount } }, { new: true }),
  incrementView: (id) =>
    Post.findByIdAndUpdate(id, { $inc: { viewCount: 1 } }, { new: true }),
  findByUser: async (currentUserId, userId, cursor, limit) => {
    const post = await Post.find({
      authorId: userId,
      ...buildCreatedAtCursorFilter(cursor),
    })
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .populate("authorId", "fullname username profilePic");
    if (post.length === 0) {
      return [];
    }
    return await hydratePostInteractions(post, currentUserId);
  },
};
