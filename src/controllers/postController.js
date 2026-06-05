import { postService } from '../services/postService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Handles post creation, lookup, deletion, and author timelines.
 */
export const postController = {
  /**
   * Creates a post for the authenticated user.
   */
  create: asyncHandler(async (req, res) => {
    const post = await postService.createPost(req.user._id, req.body);
    res.status(201).json({ data: { post } });
  }),

  /**
   * Fetches a post by id and records a view.
   */
  getById: asyncHandler(async (req, res) => {
    const post = await postService.getPost(req.user._id, req.params.id);
    res.json({ data: { post } });
  }),

  /**
   * Deletes a post owned by the authenticated user.
   */
  delete: asyncHandler(async (req, res) => {
    await postService.deletePost(req.user._id, req.params.id);
    res.status(204).send();
  }),

  /**
   * Returns paginated posts written by a specific user.
   */
  getByUser: asyncHandler(async (req, res) => {
    const result = await postService.getPostsByUser(req.user._id, req.params.userId, req.query);
    res.json(result);
  })
};
