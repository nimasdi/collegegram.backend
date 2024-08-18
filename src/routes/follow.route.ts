import { Router } from "express";
import { FollowService } from "../services/Follow.service";
import authMiddleware from "../utility/authorization";
import { Username, isUsername } from "../types/user.types";
import { HttpError } from "../utility/error-handler";
import { handelErrorResponse } from "../utility/habdle-errResponse";
import { UserService } from "../services/User.service";
import { followDto } from "../dto/follow.dto";

export const UserRoute = (followService: FollowService) => {
    const router = Router();

     /**
    * @swagger
    * /{username}:
    *   get:
    *     summary: check follow 
    *     description: check follow
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
 * /:
 *   post:
 *     summary: follow a user
 *     description: follow a user
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
     * /unfollow:
     *   put:
     *     summary: unfollow a user
     *     description: unfollow a user
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
}
 
