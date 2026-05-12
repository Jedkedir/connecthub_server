import { interactionService } from '../services/interactionService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const interactionController = {
  like: asyncHandler(async (req, res) => {
    const post = await interactionService.likePost(req.user._id, req.params.id);
    res.json({ data: { post } });
  }),

  unlike: asyncHandler(async (req, res) => {
    const post = await interactionService.unlikePost(req.user._id, req.params.id);
    res.json({ data: { post } });
  }),

  addComment: asyncHandler(async (req, res) => {
    const comment = await interactionService.addComment(req.user._id, req.params.id, req.body);
    res.status(201).json({ data: { comment } });
  }),

  getComments: asyncHandler(async (req, res) => {
    const result = await interactionService.getComments(req.user._id, req.params.id, req.query);
    res.json(result);
  }),

  getReplies: asyncHandler(async (req, res) => {
    const result = await interactionService.getReplies(
      req.params.commentId,
      req.query,
      req.user._id
    );
    res.json(result);
  }),

  likeComment: asyncHandler(async (req, res) => {
    const result = await interactionService.likeComment(req.user._id, req.params.commentId);
    res.json({ data: result });
  }),

  unlikeComment: asyncHandler(async (req, res) => {
    const result = await interactionService.unlikeComment(req.user._id, req.params.commentId);
    res.json({ data: result });
  }),

  updateComment: asyncHandler(async (req, res) => {
    const comment = await interactionService.updateComment(
      req.user._id,
      req.params.commentId,
      req.body.content
    );
    res.json({ data: { comment } });
  }),

  deleteComment: asyncHandler(async (req, res) => {
    const result = await interactionService.deleteComment(req.user._id, req.params.commentId);
    res.json({ data: result });
  }),

  bookmark: asyncHandler(async (req, res) => {
    const post = await interactionService.bookmarkPost(req.user._id, req.params.id);
    res.json({ data: { post } });
  }),

  unbookmark: asyncHandler(async (req, res) => {
    const post = await interactionService.unbookmarkPost(req.user._id, req.params.id);
    res.json({ data: { post } });
  }),

  bookmarks: asyncHandler(async (req, res) => {
    const result = await interactionService.getBookmarks(req.user._id, req.query);
    res.json(result);
  }),

  likedPosts: asyncHandler(async (req, res) => {
    const result = await interactionService.getLikedPosts(req.user._id, req.query);
    res.json(result);
  })
};
