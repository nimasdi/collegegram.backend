import { Router } from "express";
import { FollowService } from "../services/Follow.service";
import authMiddleware from "../utility/authorization";
import { Username, isUsername } from "../types/user.types";
import { HttpError } from "../utility/error-handler";
import { handelErrorResponse } from "../utility/habdle-errResponse";
import { followDto } from "../dto/follow.dto";
import { followRequestDto } from "../dto/followRequest.dto";
import { removeFollowerDto } from "../dto/removeFollow.dto";

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
    router.get("/:username", authMiddleware, async (req, res) => {
        try {
            const followerUser = req.user.username
            const followingUser = req.params.username.trim()
            if (!isUsername(followingUser)) {
                throw new HttpError(400, "check user name Field")
            }

            const followed = await followService.checkFollow(followingUser, followerUser)

            return res.status(200).json({ followed })
        } catch (error) {
            handelErrorResponse(res, error)
        }
    });

  
//     router.post("", authMiddleware, async (req, res, next) => {
//         try {
//             const followerUser: Username = req.user.username
//             if (!followerUser) {
//                 throw new HttpError(400, "user not found.")
//             }

//             const followingUser = followDto.parse(req.body)
//             await followService.follow(followingUser.followingUsername, followerUser)
//             res.status(200).json({ message: "user followd." })
//         } catch (error) {
//             handelErrorResponse(res, error)
//         }
//     })


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
            if (!followerUser) {
                throw new HttpError(400, "user not found.")
            }

            const followingUser = followDto.parse(req.body)
            await followService.unfollow(followingUser.followingUsername, followerUser)
            res.status(200).json({ message : "user unfollowed." })
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

            const followerUser = removeFollowerDto.parse(req.body)
            await followService.unfollow(followerUser.followerUsername, followingUser)
            res.status(200).json({message:"follower removed"})
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

            const followerUser = removeFollowerDto.parse(req.body)
            await followService.unfollow(followerUser.followerUsername, followingUser)
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
    router.get("/state", authMiddleware, async (req, res) => {
        try {
            const username = req.user.username

            const followState = await followService.getUserFollowState(username)

            return res.status(200).json(followState)
        } catch (error) {
            handelErrorResponse(res, error)
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
    router.get("/:username/list", authMiddleware, async (req, res) => {
        try {
            const username = req.params.username
            if (!isUsername(username)) {
                throw new HttpError(400, "check user name Field")
            }
            const followersAndFollowings = await followService.getFollowersAndFollowing(username)

            res.status(200).json(followersAndFollowings)
        } catch (error) {
            handelErrorResponse(res, error)
        }
    });

    /**
    * @swagger
    * /follow/request:
    *   post:
    *     summary: Send a follow request
    *     description: Allows a user to send a follow request to another user.
    *     tags:
    *       - Follow Requests
    *     security:
    *       - bearerAuth: []
    *     requestBody:
    *       required: true
    *       content:
    *         application/json:
    *           schema:
    *             type: object
    *             properties:
    *               receiver:
    *                 type: string
    *                 example: "userB"
    *                 description: The username of the user to send the follow request to.
    *             required:
    *               - receiver
    *     responses:
    *       200:
    *         description: Follow request sent successfully
    *       400:
    *         description: Invalid input data or user not found
    *       500:
    *         description: Server error
    */
    router.post('/request', authMiddleware, async (req, res) => {
        try {

            const requestData = followRequestDto.parse({
                sender: req.user.username,
                receiver: req.body.receiver
            })

            await followService.sendFollowRequest(requestData);

            res.status(200).send({ message: "Follow request sent successfully" });
        } catch (error) {
            handelErrorResponse(res, error);
        }
    });


    /**
     * @swagger
     * /follow/request/handle:
     *   post:
     *     summary: Accept or decline a follow request
     *     description: Allows a user to accept or decline a follow request.
     *     tags:
     *       - Follow Requests
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               sender:
     *                 type: string
     *                 example: "userA"
     *                 description: The username of the user who sent the follow request.
     *               action:
     *                 type: string
     *                 enum: [accept, decline]
     *                 example: "accept"
     *                 description: The action to take on the follow request.
     *             required:
     *               - sender
     *               - action
     *     responses:
     *       200:
     *         description: Follow request action completed successfully
     *       400:
     *         description: Invalid input data or follow request not found
     *       500:
     *         description: Server error
     */
    router.post('/request/handle', authMiddleware, async (req, res) => {
        try {
            const followRequestAction = {
                sender: req.body.sender,
                receiver: req.user.username,
                action: req.body.action,
            };

            const result = await followService.acceptOrDeclineFollowRequest(followRequestAction);

            if (result) {
                res.status(200).send({ message: `Follow request ${followRequestAction.action}ed successfully` });
            } else {
                res.status(400).send({ message: "Follow request not found or already processed" });
            }
        } catch (error) {
            handelErrorResponse(res, error);
        }
    });



    return router
}

