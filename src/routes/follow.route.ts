import { Router } from "express";
import { FollowService } from "../services/Follow.service";
import authMiddleware from "../utility/authorization";
import { Username, isUsername } from "../types/user.types";
import { HttpError } from "../utility/error-handler";
import { handelErrorResponse } from "../utility/habdle-errResponse";
import { followDto } from "../dto/follow.dto";

export const FollowRoute = (followService: FollowService) => {
    const router = Router();

     /**
    * @swagger
    * /follow/{username}:
    *   get:
    *     summary: check follow 
    *     description: check follow
    *     tags:
    *       - Follow
    *     parameters:
    *         - in: path
    *           name: username
    *           required: true
    *           description: The ID of the post to be updated.
    *           schema:
    *             type: string
    *     security:
    *       - bearerAuth: []
    *     responses:
    *       200:
    *         description: User information retrieved successfully
    *       404:
    *         description: User not found
    *       500:
    *         description: Internal server error
    */
    router.get("/:username", authMiddleware, async(req, res) => {
        try {
            const followerUser = req.user.username
            const followingUser = req.params.username.trim()
            if(!isUsername(followingUser)){
                throw new HttpError(400, "check user name Field")
            }

            const followed = await followService.checkFollow(followingUser, followerUser)

            return res.status(200).json({followed})
        } catch (error) {
            handelErrorResponse(res,error)
        }
    });

   /**
 * @swagger
 * /follow:
 *   post:
 *     summary: follow a user
 *     description: follow a user
 *     tags:
 *       - Follow
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - followingUsername
 *             properties:
 *               followingUsername:
 *                 type: string
 *                 example: johndoe
 *     responses:
 *       200:
 *         description: followed
 */
    router.post("", authMiddleware, async (req, res, next) => {
        try {
            const followerUser: Username = req.user.username
            if(!followerUser) {
                throw new HttpError(400, "user not found.") 
            }

            const followingUser = followDto.parse(req.body)
            await followService.follow(followingUser.followingUsername, followerUser)
            res.status(200).json({message:"user followd."})
        } catch (error) {
            handelErrorResponse(res, error)
        }
    })


    /**
     * @swagger
     * /follow:
     *   delete:
     *     summary: unfollow a user
     *     description: unfollow a user
     *     tags:
     *       - Follow
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - followingUsername
     *             properties:
     *               followingUsername:
     *                 type: string
     *                 example: johndoe
     *     responses:
     *       200:
     *         description: followed
     */
    router.delete("", authMiddleware, async (req, res, next) => {
        try {
            const followerUser: Username = req.user.username
            if(!followerUser) {
                throw new HttpError(400, "user not found.") 
            }

            const followingUser = followDto.parse(req.body)
            await followService.unfollow(followingUser.followingUsername, followerUser)
            res.status(200).json({message:"user unfollowed."})
        } catch (error) {
            handelErrorResponse(res, error)
        }
    })

    /**
     * @swagger
     * /follow/removeFollower:
     *   delete:
     *     summary: remove a follower
     *     description: remove a follower
     *     tags:
     *       - Follow
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - followerUsername
     *             properties:
     *               followerUsername:
     *                 type: string
     *                 example: johndoe
     *     responses:
     *       200:
     *         description: followed
     */
    router.delete("/removeFollower", authMiddleware, async (req, res, next) => {
        try {
            const followingUser: Username = req.user.username
            if(!followingUser) {
                throw new HttpError(400, "user not found.") 
            }

            const followerUser = removeFollowDto.parse(req.body)
            await followService.unfollow(followerUser.followingUsername, followingUser)
            res.status(200).json({message:"follower removed"})
        } catch (error) {
            handelErrorResponse(res, error)
        }
    })

    /**
    * @swagger
    * /follow/state:
    *   get:
    *     summary: check follower and followers of loggedIn user 
    *     description: check follow
    *     tags:
    *       - Follow
    *     security:
    *       - bearerAuth: []
    *     responses:
    *       200:
    *         description: User information retrieved successfully
    *       404:
    *         description: User not found
    *       500:
    *         description: Internal server error
    */
    router.get("/state", authMiddleware, async(req, res) => {
        try {
            const username = req.user.username

            const followState = await followService.getUserFollowState(username)

            return res.status(200).json(followState)
        } catch (error) {
            handelErrorResponse(res,error)
        }
    });

    /**
    * @swagger
    * /follow/{username}/list:
    *   get:
    *     summary: follower and followers list
    *     description: check followers and following
    *     tags:
    *       - Follow
    *     parameters:
    *         - in: path
    *           name: username
    *           required: true
    *           description: The ID of the post to be updated.
    *           schema:
    *             type: string
    *     security:
    *       - bearerAuth: []
    *     responses:
    *       200:
    *         description: User information retrieved successfully
    *       404:
    *         description: User not found
    *       500:
    *         description: Internal server error
    */
    router.get("/:username/list", authMiddleware, async(req, res) => {
        try {
            const username = req.params.username
            if(!isUsername(username)){
                throw new HttpError(400, "check user name Field")
            }
            const followersAndFollowings = await followService.getFollowersAndFollowing(username)

            res.status(200).json(followersAndFollowings)
        } catch (error) {
            handelErrorResponse(res,error)
        }
    });

    return router
}
 
