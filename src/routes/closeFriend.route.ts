import { Router } from "express";
import authMiddleware from "../utility/authorization";
import { Username, isUsername } from "../types/user.types";
import { HttpError } from "../utility/error-handler";
import { handelErrorResponse } from "../utility/habdle-errResponse";
import { CloseFriendService } from "../services/CloseFriend.service";
import { closeFriendDto } from "../dto/fcloseFriend.dto";

export const FollowRoute = (closeFriendService: CloseFriendService) => {
    const router = Router();

    /**
   * @swagger
   * /closeFriend/{username}:
   *   get:
   *     summary: check closeFriend 
   *     description: check closeFriend
   *     tags:
   *       - Close
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

            const closeFriend = await closeFriendService.checkCloseFriend(followingUser, followerUser)

            return res.status(200).json({ closeFriend })
        } catch (error) {
            handelErrorResponse(res, error)
        }
    });

    /**
  * @swagger
  * /addCloseFriend:
  *   put:
  *     summary: addCloseFriend
  *     description: addCloseFriend
  *     tags:
  *       - Close
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
    router.put("", authMiddleware, async (req, res, next) => {
        try {
            const followerUser: Username = req.user.username
            if (!followerUser) {
                throw new HttpError(400, "user not found.")
            }

            const followingUser = closeFriendDto.parse(req.body)
            await closeFriendService.addCloseFriends(followingUser.followingUsername, followerUser)
            res.status(200).json({ message: "added." })
        } catch (error) {
            handelErrorResponse(res, error)
        }
    })


    /**
  * @swagger
  * /removeCloseFriend:
  *   put:
  *     summary: removeCloseFriend
  *     description: removeCloseFriend
  *     tags:
  *       - Close
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
    router.put("", authMiddleware, async (req, res, next) => {
        try {
            const followerUser: Username = req.user.username
            if (!followerUser) {
                throw new HttpError(400, "user not found.")
            }

            const followingUser = closeFriendDto.parse(req.body)
            await closeFriendService.removeCloseFriends(followingUser.followingUsername, followerUser)
            res.status(200).json({ message: "removed." })
        } catch (error) {
            handelErrorResponse(res, error)
        }
    })

    return router
}

