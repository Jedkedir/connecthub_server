import mongoose from "mongoose";
import { Post } from "../models/Post.js";
import { User } from "../models/User.js";
import { hydratePostInteractions } from "../utils/postHelper.js";
import { buildCreatedAtCursorFilter } from "../utils/pagination.js";

const userProjection = {
  fullname: 1,
  username: 1,
  profilePic: 1,
  bio: 1,
};

const buildPostQuery = (filter, sort, limit) =>
  Post.find(filter)
    .sort(sort)
    .limit(limit + 1)
    .populate("authorId", "fullname username profilePic");

export const feedRepository = {
  findRecent: async (userId, filter, cursor, limit) => {
    const posts = await buildPostQuery(
      {
        ...filter,
        ...buildCreatedAtCursorFilter(cursor),
      },
      { createdAt: -1, _id: -1 },
      limit,
    );

    return hydratePostInteractions(posts, userId);
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
        {
          $addFields: {
            isLiked: { $gt: [{ $size: "$userLike" }, 0] },
            isBookmarked: { $gt: [{ $size: "$userBookmark" }, 0] },
          },
        },
      );
    } else {
      pipeline.push({
        $addFields: { isLiked: false, isBookmarked: false },
      });
    }

    pipeline.push({
      $project: {
        content: 1,
        mediaUrls: 1,
        topics: 1,
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
          fullname: "$author.fullname",
          username: "$author.username",
          profilePic: "$author.profilePic",
        },
      },
    });

    return Post.aggregate(pipeline);
  },

  findByUsername: async (userId, username, cursor, limit) => {
    const user = await User.findOne({ username }).select(userProjection).lean();
    if (!user) return { user: null, posts: [] };

    const posts = await buildPostQuery(
      {
        authorId: user._id,
        ...buildCreatedAtCursorFilter(cursor),
      },
      { createdAt: -1, _id: -1 },
      limit,
    );

    return {
      user,
      posts: await hydratePostInteractions(posts, userId),
    };
  },

  findByContent: async (userId, query, cursor, limit) => {
    const filter = query
      ? { $text: { $search: query }, ...buildCreatedAtCursorFilter(cursor) }
      : buildCreatedAtCursorFilter(cursor);

    const posts = await buildPostQuery(
      filter,
      query
        ? { score: { $meta: "textScore" }, createdAt: -1 }
        : { createdAt: -1, _id: -1 },
      limit,
    );

    if (query) posts.select({ score: { $meta: "textScore" } });

    return hydratePostInteractions(posts, userId);
  },

  findByTopic: async (userId, topic, cursor, limit) => {
    const normalizedTopic = topic.toLowerCase().replace(/^#/, "");
    const posts = await buildPostQuery(
      {
        topics: normalizedTopic,
        ...buildCreatedAtCursorFilter(cursor),
      },
      { createdAt: -1, _id: -1 },
      limit,
    );

    return hydratePostInteractions(posts, userId);
  },
};
