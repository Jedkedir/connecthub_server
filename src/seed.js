import bcrypt from 'bcrypt';
import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { Bookmark } from './models/Bookmark.js';
import { Comment } from './models/Comment.js';
import { CommentLike } from './models/CommentLike.js';
import { Follow } from './models/Follow.js';
import { FollowRequest } from './models/FollowRequest.js';
import { Like } from './models/Like.js';
import { Notification } from './models/Notification.js';
import { Post } from './models/Post.js';
import { User } from './models/User.js';
import { logger } from './utils/logger.js';
/**
 * User:{username,email,password,bio,profilePic}
 * Post:{content,mediaUrls}
 * Like:{postId}
 * Bookmark:{postId}
 * Comment:{postId,content}
 * FollowRequest:{toUserId}
 * Follow:{followingId}
 * Notification:{type,fromUserId,postId,commentId}
 */


const seed = async () => {
  await connectDatabase();

  await Promise.all([
    Bookmark.deleteMany({}),
    Comment.deleteMany({}),
    CommentLike.deleteMany({}),
    Follow.deleteMany({}),
    FollowRequest.deleteMany({}),
    Like.deleteMany({}),
    Notification.deleteMany({}),
    Post.deleteMany({}),
    User.deleteMany({})
  ]);

  const password = await bcrypt.hash('password!', env.bcryptSaltRounds);

  //Creat Users
  const [tester1, tester2, tester3,tester4] = await User.insertMany([
    {
      username: 'tester1',
      email: 'tester1@app.com',
      profilePic: 'https://example.com/ada.jpg',
      password,
      bio: 'Backend systems, distributed ideas.'
    },
    {
      username: 'tester2',
      email: 'tester2@app.com',
      profilePic: 'https://example.com/tester.jpg',
      password,
      bio: 'Compilers, ships, and clear interfaces.'
    },
    {
      username: 'tester3',
      email: 'tester3@app.com',
      profilePic: 'https://example.com/tester.jpg',
      password,
      bio: 'Kernel notes and practical engineering.'
    },
    {
      username: 'tester4',
      email: 'tester4@app.com',
      profilePic: 'https://example.com/tester.jpg',
      password,
      bio: 'Kernel notes and practical engineering.'
    }
  ]);
  //Create Follow
  await Follow.create({ followerId: tester1._id, followingId: tester2._id });
  await Follow.create({ followerId: tester2._id, followingId: tester3._id });
  await Follow.create({ followerId: tester3._id, followingId: tester1._id });
  await User.findByIdAndUpdate(tester1._id, { followingCount: 1 });
  await User.findByIdAndUpdate(tester2._id, { followersCount: 1 });
  await User.findByIdAndUpdate(tester3._id, { followersCount: 1 });
  
  //Create Follow Request
  await FollowRequest.create({ requesterId: tester4._id, recipientId: tester1._id });
  await FollowRequest.create({ requesterId: tester4._id, recipientId: tester2._id });
  await FollowRequest.create({ requesterId: tester4._id, recipientId: tester3._id });
  

  

  const posts = await Post.insertMany([
    {
      authorId: tester1._id,
      content: 'A good API feels quiet: predictable inputs, boring failure modes, useful logs.',
      mediaUrls:["https://images.stockcake.com/public/a/3/9/a398c3fc-790b-4c2c-8715-c8d5c627b08a_large/smiling-professional-man-stockcake.jpg"],
      likesCount: 2,
      commentsCount: 1,
      viewCount: 20
    },
    {
      authorId: tester2._id,
      content: 'Performance starts with choosing the right index before the endpoint gets famous.',
      mediaUrls:["https://images.stockcake.com/public/a/3/9/a398c3fc-790b-4c2c-8715-c8d5c627b08a_large/smiling-professional-man-stockcake.jpg"],
      likesCount: 1,
      commentsCount: 0,
      viewCount: 12
    },
    {
      authorId: tester3._id,
      content: 'ConnectHub seed data is alive. Try the global and personalized feeds.',
      mediaUrls:["https://images.stockcake.com/public/a/3/9/a398c3fc-790b-4c2c-8715-c8d5c627b08a_large/smiling-professional-man-stockcake.jpg"],
      likesCount: 0,
      commentsCount: 0,
      viewCount: 5
    }
  ]);
  console.log('Posts created:', posts);
  // Create Likes
  await Like.insertMany([
    { userId: tester1._id, postId: posts[0]._id },
    { userId: tester2._id, postId: posts[0]._id },
    { userId: tester1._id, postId: posts[1]._id }
  ]);

  // Create Bookmarks
  await Bookmark.insertMany([
    { userId: tester1._id, postId: posts[1]._id },
    { userId: tester2._id, postId: posts[0]._id }
  ]);

  // Create Comments
  const comments = await Comment.insertMany([
    {
      userId: tester2._id,
      postId: posts[0]._id,
      content: 'Great insights on API design!'
    },
    {
      userId: tester2._id,
      postId: posts[0]._id,
      content: 'Great design!'
    }
  ]);

  // Create Comment Likes
  await CommentLike.insertMany([
    { userId: tester1._id, commentId: comments[0]._id },
    { userId: tester3._id, commentId: comments[0]._id }
  ]);
  // Create Comment Reply
  await Comment.insertMany([
    {
      userId: tester3._id,
      postId: posts[0]._id,
      content: 'I agree, very well said!',
      parentCommentId: comments[0]._id
    },
    {
      userId: tester2._id,
      postId: posts[0]._id,
      content: 'Well said!',
      parentCommentId: comments[0]._id
    }
  ]);


  logger.info('Seed completed', {
    users: ['tester1@connecthub.local', 'tester2@connecthub.local', 'tester3@connecthub.local'],
    password: 'Password123!'
  });

  await disconnectDatabase();
};

seed().catch(async (error) => {
  logger.error('Seed failed', { error: error.message, stack: error.stack });
  await disconnectDatabase();
  process.exit(1);
});
