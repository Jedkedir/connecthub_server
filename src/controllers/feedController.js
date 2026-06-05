import { feedService } from '../services/feedService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Handles feed-related HTTP requests.
 */
export const feedController = {
  /**
   * Returns recent posts from accounts the authenticated user follows.
   */
  personalized: asyncHandler(async (req, res) => {
    const result = await feedService.personalized(req.user._id, req.query);
    res.json(result);
  }),

  /**
   * Returns a ranked global feed.
   */
  global: asyncHandler(async (req, res) => {
    const result = await feedService.global(req.user._id, req.query);
    res.json(result);
  }),

  /**
   * Searches or browses posts by user, topic, content, or recency.
   */
  explore: asyncHandler(async (req, res) => {
    console.log("Received explore request with query:", req.query);
    const result = await feedService.explore(req.user._id, req.query);
    res.json(result);
  })
};
