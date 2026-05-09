import bcrypt from 'bcrypt';
import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { Bookmark } from './models/Bookmark.js';
import { Comment } from './models/Comment.js';
import { Follow } from './models/Follow.js';
import { FollowRequest } from './models/FollowRequest.js';
import { Like } from './models/Like.js';
import { Notification } from './models/Notification.js';
import { Post } from './models/Post.js';
import { User } from './models/User.js';
import { logger } from './utils/logger.js';

const seed = async () => {
  await connectDatabase();

  await Promise.all([
    Bookmark.deleteMany({}),
    Comment.deleteMany({}),
    Follow.deleteMany({}),
    FollowRequest.deleteMany({}),
    Like.deleteMany({}),
    Notification.deleteMany({}),
    Post.deleteMany({}),
    User.deleteMany({})
  ]);

  const password = await bcrypt.hash('Password123!', env.bcryptSaltRounds);

  const [ada, grace, linus] = await User.insertMany([
    {
      username: 'ada',
      email: 'ada@connecthub.local',
      password,
      bio: 'Backend systems, distributed ideas.'
    },
    {
      username: 'grace',
      email: 'grace@connecthub.local',
      password,
      bio: 'Compilers, ships, and clear interfaces.'
    },
    {
      username: 'linus',
      email: 'linus@connecthub.local',
      password,
      bio: 'Kernel notes and practical engineering.'
    }
  ]);

  await Follow.create({ followerId: ada._id, followingId: grace._id });
  await User.findByIdAndUpdate(ada._id, { followingCount: 1 });
  await User.findByIdAndUpdate(grace._id, { followersCount: 1 });

  const posts = await Post.insertMany([
    {
      authorId: grace._id,
      content: 'A good API feels quiet: predictable inputs, boring failure modes, useful logs.',
      likesCount: 2,
      commentsCount: 1,
      viewCount: 20
    },
    {
      authorId: linus._id,
      content: 'Performance starts with choosing the right index before the endpoint gets famous.',
      likesCount: 1,
      commentsCount: 0,
      viewCount: 12
    },
    {
      authorId: ada._id,
      content: 'ConnectHub seed data is alive. Try the global and personalized feeds.',
      likesCount: 0,
      commentsCount: 0,
      viewCount: 5
    }
  ]);

  await Like.insertMany([
    { userId: ada._id, postId: posts[0]._id },
    { userId: linus._id, postId: posts[0]._id },
    { userId: ada._id, postId: posts[1]._id }
  ]);

  await Comment.create({
    userId: ada._id,
    postId: posts[0]._id,
    content: 'That is exactly the kind of boring I like.'
  });

  logger.info('Seed completed', {
    users: ['ada@connecthub.local', 'grace@connecthub.local', 'linus@connecthub.local'],
    password: 'Password123!'
  });

  await disconnectDatabase();
};

seed().catch(async (error) => {
  logger.error('Seed failed', { error: error.message, stack: error.stack });
  await disconnectDatabase();
  process.exit(1);
});
