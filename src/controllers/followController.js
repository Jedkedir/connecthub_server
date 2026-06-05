import { followService } from '../services/followService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Handles follow request and relationship HTTP requests.
 */
export const followController = {
  /**
   * Sends a follow request from the authenticated user to a target user.
   */
  request: asyncHandler(async (req, res) => {
    const followRequest = await followService.sendRequest(req.user._id, req.body.targetUserId);
    res.status(201).json({ data: { followRequest } });
  }),

  /**
   * Accepts a pending follow request addressed to the authenticated user.
   */
  accept: asyncHandler(async (req, res) => {
    const followRequest = await followService.acceptRequest(req.user._id, req.body.requesterId);
    res.json({ data: { followRequest } });
  }),

  /**
   * Rejects a pending follow request addressed to the authenticated user.
   */
  reject: asyncHandler(async (req, res) => {
    const followRequest = await followService.rejectRequest(req.user._id, req.body.requesterId);
    res.json({ data: { followRequest } });
  }),

  /**
   * Removes an existing follow relationship for the authenticated user.
   */
  unfollow: asyncHandler(async (req, res) => {
    const result = await followService.unfollow(req.user._id, req.body.targetUserId);
    res.json({ data: result });
  }),
  /**
   * Lists followers for a user.
   */
  getFollowers: asyncHandler(async (req, res) => {
    const followers = await followService.getFollowers(req.params.id);
    res.json({ data: { followers } });
  }),
  /**
   * Lists accounts followed by a user.
   */
  getFollowing: asyncHandler(async (req, res) => {
    const following = await followService.getFollowing(req.params.id);
    res.json({ data: { following } });
  })

};
