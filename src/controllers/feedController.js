import { feedService } from '../services/feedService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const feedController = {
  personalized: asyncHandler(async (req, res) => {
    const result = await feedService.personalized(req.user._id, req.query);
    res.json(result);
  }),

  global: asyncHandler(async (req, res) => {
    const result = await feedService.global(req.user._id, req.query);
    res.json(result);
  }),

  explore: asyncHandler(async (req, res) => {
    const result = await feedService.explore(req.user._id, req.query);
    res.json(result);
  })
};
