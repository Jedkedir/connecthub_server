import { interactionService } from '../services/interactionService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Handles post, comment, bookmark, and like interaction HTTP requests.
 */
export const interactionController = {
  /**
   * Likes a post for the authenticated user.
   */
  like: asyncHandler(async (req, res) => {
    const post = await interactionService.likePost(req.user._id, req.params.id);
    res.json({ data: { post } });
  }),

  /**
   * Removes the authenticated user's like from a post.
   */
  unlike: asyncHandler(async (req, res) => {
    const post = await interactionService.unlikePost(req.user._id, req.params.id);
    res.json({ data: { post } });
  }),

  /**
   * Adds a comment or reply to a post.
   */
  addComment: asyncHandler(async (req, res) => {
    const comment = await interactionService.addComment(req.user._id, req.params.id, req.body);
    res.status(201).json({ data: { comment } });
  }),

  /**
   * Returns paginated top-level comments for a post.
   */
  getComments: asyncHandler(async (req, res) => {
    const result = await interactionService.getComments(req.user._id, req.params.id, req.query);
    res.json(result);
  }),

  /**
   * Returns paginated replies for a comment.
   */
  getReplies: asyncHandler(async (req, res) => {
    const result = await interactionService.getReplies(
      req.params.commentId,
      req.query,
      req.user._id
    );
    res.json(result);
  }),

  /**
   * Likes a comment for the authenticated user.
   */
  likeComment: asyncHandler(async (req, res) => {
    const result = await interactionService.likeComment(req.user._id, req.params.commentId);
    res.json({ data: result });
  }),

  /**
   * Removes the authenticated user's like from a comment.
   */
  unlikeComment: asyncHandler(async (req, res) => {
    const result = await interactionService.unlikeComment(req.user._id, req.params.commentId);
    res.json({ data: result });
  }),

  /**
   * Updates a comment owned by the authenticated user.
   */
  updateComment: asyncHandler(async (req, res) => {
    const comment = await interactionService.updateComment(
      req.user._id,
      req.params.commentId,
      req.body.content
    );
    res.json({ data: { comment } });
  }),

  /**
   * Deletes a comment owned by the authenticated user.
   */
  deleteComment: asyncHandler(async (req, res) => {
    const result = await interactionService.deleteComment(req.user._id, req.params.commentId);
    res.json({ data: result });
  }),

  /**
   * Bookmarks a post for the authenticated user.
   */
  bookmark: asyncHandler(async (req, res) => {
    const post = await interactionService.bookmarkPost(req.user._id, req.params.id);
    res.json({ data: { post } });
  }),

  /**
   * Removes the authenticated user's bookmark from a post.
   */
  unbookmark: asyncHandler(async (req, res) => {
    const post = await interactionService.unbookmarkPost(req.user._id, req.params.id);
    res.json({ data: { post } });
  }),

  /**
   * Returns paginated bookmarked posts for the authenticated user.
   */
  bookmarks: asyncHandler(async (req, res) => {
    const result = await interactionService.getBookmarks(req.user._id, req.query);
    res.json(result);
  }),

  /**
   * Returns paginated posts liked by the authenticated user.
   */
  likedPosts: asyncHandler(async (req, res) => {
    const result = await interactionService.getLikedPosts(req.user._id, req.query);
    res.json(result);
  })
};
