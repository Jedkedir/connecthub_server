import { Post } from "../models/Post.js";
import { buildCreatedAtCursorFilter } from "../utils/pagination.js";
import mongoose from "mongoose";
import { hydratePostInteractions } from "../utils/postHelper.js";

export const postRepository = {
  create: (data) => Post.create(data),
  findById: async (userId, id) =>{
    const post = await Post.findById(id).populate("authorId", "username profilePic bio");
    if (!post) return null;
    console.log('Post found for ID:', id, post);
    const hydrated = await hydratePostInteractions([post], userId);
    return hydrated[0];
  },
  findByIdRaw: (id) => Post.findById(id),
  deleteById: (id) => Post.findByIdAndDelete(id),
  increment: (id, field, amount) =>
    Post.findByIdAndUpdate(id, { $inc: { [field]: amount } }, { new: true }),
  incrementView: (id) =>
    Post.findByIdAndUpdate(id, { $inc: { viewCount: 1 } }, { new: true }),
  findByUser: async (currentUserId, userId, cursor, limit) =>{
     const post = await Post.find({ authorId: userId, ...buildCreatedAtCursorFilter(cursor) })
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .populate("authorId", "username profilePic")
      console.log('Posts found for user:', userId, post);
      if (post.length === 0) {
        return [];
      }
      return await hydratePostInteractions(post, currentUserId);
    },
  findRecent: async (userId, filter, limit) =>{
    const post = await Post.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .populate("authorId", "username profilePic")
    return await hydratePostInteractions(post, userId );
    },
  findExplore: async (userId,query, cursor, limit) => {
    const cursorFilter = buildCreatedAtCursorFilter(cursor);
    const filter = query
      ? { $text: { $search: query }, ...cursorFilter }
      : cursorFilter;
    const dbQuery = await Post.find(filter)
      .sort(
        query
          ? { score: { $meta: "textScore" }, createdAt: -1 }
          : { createdAt: -1, _id: -1 },
      )
      .limit(limit + 1)
      .populate("authorId", "username profilePic");

    if (query) dbQuery.select({ score: { $meta: "textScore" } });
      return await hydratePostInteractions(dbQuery, userId);
  },
  aggregateGlobalFeed: (userId, cursor, limit) => {
    const after = cursor
      ? {
          ...cursor,
          id: mongoose.Types.ObjectId.createFromHexString(cursor.id),
        }
      : null;
    const pipeline = [
      {
        $addFields: {
          score: { $add: ["$likesCount", "$commentsCount", "$viewCount"] },
        },
      },
    ];

    if (after) {
      pipeline.push({
        $match: {
          $expr: {
            $or: [
              { $lt: ["$score", after.score] },
              {
                $and: [
                  { $eq: ["$score", after.score] },
                  { $lt: ["$createdAt", new Date(after.createdAt)] },
                ],
              },
              {
                $and: [
                  { $eq: ["$score", after.score] },
                  { $eq: ["$createdAt", new Date(after.createdAt)] },
                  { $lt: ["$_id", after.id] },
                ],
              },
            ],
          },
        },
      });
    }

    pipeline.push(
      { $sort: { score: -1, createdAt: -1, _id: -1 } },
      { $limit: limit + 1 },
      {
        $lookup: {
          from: "users",
          localField: "authorId",
          foreignField: "_id",
          as: "author",
        },
      },
      { $unwind: "$author" },
    );

    if (userId) {
      const currentUserId = new mongoose.Types.ObjectId(userId);
      pipeline.push(
        // Look for a match in Likes collection
        {
          $lookup: {
            from: "likes", 
            let: { postId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$postId", "$$postId"] },
                      { $eq: ["$userId", currentUserId] },
                    ],
                  },
                },
              },
            ],
            as: "userLike",
          },
        },
        // Look for a match in Bookmarks collection
        {
          $lookup: {
            from: "bookmarks", 
            let: { postId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$postId", "$$postId"] },
                      { $eq: ["$userId", currentUserId] },
                    ],
                  },
                },
              },
            ],
            as: "userBookmark",
          },
        },
        // Convert the arrays into Booleans
        {
          $addFields: {
            isLiked: { $gt: [{ $size: "$userLike" }, 0] },
            isBookmarked: { $gt: [{ $size: "$userBookmark" }, 0] },
          },
        },
      );
    } else {
      // Default to false 
      pipeline.push({
        $addFields: { isLiked: false, isBookmarked: false },
      });
    }

    pipeline.push({
      $project: {
        content: 1,
        mediaUrls: 1,
        likesCount: 1,
        commentsCount: 1,
        bookmarksCount: 1,
        viewCount: 1,
        createdAt: 1,
        updatedAt: 1,
        score: 1,
        isLiked: 1, 
        isBookmarked: 1, 
        authorId: {
          _id: "$author._id",
          username: "$author.username",
          profilePic: "$author.profilePic",
        },
      },
    });

    return Post.aggregate(pipeline);
  },
};
