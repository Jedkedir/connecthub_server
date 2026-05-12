import { followService } from '../services/followService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const followController = {
  request: asyncHandler(async (req, res) => {
    const followRequest = await followService.sendRequest(req.user._id, req.body.targetUserId);
    res.status(201).json({ data: { followRequest } });
  }),

  accept: asyncHandler(async (req, res) => {
    const followRequest = await followService.acceptRequest(req.user._id, req.body.requesterId);
    res.json({ data: { followRequest } });
  }),

  reject: asyncHandler(async (req, res) => {
    const followRequest = await followService.rejectRequest(req.user._id, req.body.requesterId);
    res.json({ data: { followRequest } });
  }),

  unfollow: asyncHandler(async (req, res) => {
    const result = await followService.unfollow(req.user._id, req.body.targetUserId);
    res.json({ data: result });
  }),
  getFollowers: asyncHandler(async (req, res) => {
    const followers = await followService.getFollowers(req.params.id);
    res.json({ data: { followers } });
  }),
  getFollowing: asyncHandler(async (req, res) => {
    const following = await followService.getFollowing(req.params.id);
    res.json({ data: { following } });
  })

};
