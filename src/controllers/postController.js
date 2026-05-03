import { postService } from '../services/postService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const postController = {
  create: asyncHandler(async (req, res) => {
    const post = await postService.createPost(req.user._id, req.body);
    res.status(201).json({ data: { post } });
  }),

  getById: asyncHandler(async (req, res) => {
    const post = await postService.getPost(req.params.id);
    res.json({ data: { post } });
  }),

  delete: asyncHandler(async (req, res) => {
    await postService.deletePost(req.user._id, req.params.id);
    res.status(204).send();
  }),

  getByUser: asyncHandler(async (req, res) => {
    const result = await postService.getPostsByUser(req.params.userId, req.query);
    res.json(result);
  })
};
