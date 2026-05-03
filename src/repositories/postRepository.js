import { Post } from '../models/Post.js';
import { buildCreatedAtCursorFilter } from '../utils/pagination.js';
import mongoose from 'mongoose';

export const postRepository = {
  create: (data) => Post.create(data),
  findById: (id) => Post.findById(id).populate('authorId', 'username profilePic bio'),
  findByIdRaw: (id) => Post.findById(id),
  deleteById: (id) => Post.findByIdAndDelete(id),
  increment: (id, field, amount) =>
    Post.findByIdAndUpdate(id, { $inc: { [field]: amount } }, { new: true }),
  incrementView: (id) => Post.findByIdAndUpdate(id, { $inc: { viewCount: 1 } }, { new: true }),
  findByUser: (userId, cursor, limit) =>
    Post.find({ authorId: userId, ...buildCreatedAtCursorFilter(cursor) })
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .populate('authorId', 'username profilePic'),
  findRecent: (filter, limit) =>
    Post.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .populate('authorId', 'username profilePic'),
  findExplore: (query, cursor, limit) => {
    const cursorFilter = buildCreatedAtCursorFilter(cursor);
    const filter = query ? { $text: { $search: query }, ...cursorFilter } : cursorFilter;
    const dbQuery = Post.find(filter)
      .sort(query ? { score: { $meta: 'textScore' }, createdAt: -1 } : { createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .populate('authorId', 'username profilePic');

    if (query) dbQuery.select({ score: { $meta: 'textScore' } });
    return dbQuery;
  },
  aggregateGlobalFeed: (cursor, limit) => {
    const after = cursor
      ? {
          ...cursor,
          id: mongoose.Types.ObjectId.createFromHexString(cursor.id)
        }
      : null;
    const pipeline = [
      {
        $addFields: {
          score: { $add: ['$likesCount', '$commentsCount', '$viewCount'] }
        }
      }
    ];

    if (after) {
      pipeline.push({
        $match: {
          $expr: {
            $or: [
              { $lt: ['$score', after.score] },
              {
                $and: [
                  { $eq: ['$score', after.score] },
                  { $lt: ['$createdAt', new Date(after.createdAt)] }
                ]
              },
              {
                $and: [
                  { $eq: ['$score', after.score] },
                  { $eq: ['$createdAt', new Date(after.createdAt)] },
                  { $lt: ['$_id', after.id] }
                ]
              }
            ]
          }
        }
      });
    }

    pipeline.push(
      { $sort: { score: -1, createdAt: -1, _id: -1 } },
      { $limit: limit + 1 },
      {
        $lookup: {
          from: 'users',
          localField: 'authorId',
          foreignField: '_id',
          as: 'author'
        }
      },
      { $unwind: '$author' },
      {
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
          authorId: {
            _id: '$author._id',
            username: '$author.username',
            profilePic: '$author.profilePic'
          }
        }
      }
    );

    return Post.aggregate(pipeline);
  }
};
