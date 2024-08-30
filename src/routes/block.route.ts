import { Router } from "express";
import authMiddleware from "../utility/authorization";
import { Username, isUsername } from "../types/user.types";
import { HttpError } from "../utility/error-handler";
import { handelErrorResponse } from "../utility/habdle-errResponse";
import { BlockService } from "../services/Block.service";
import { blockDto } from "../dto/block.dto";

export const BlockRoute = (blockService:BlockService) => {
    const router = Router();


    /**
    * @swagger
    * /block/list:
    *   get:
    *     summary: list of blocked users
    *     description: list of blocked users
    *     tags:
    *       - Block
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
    router.get("/list", authMiddleware, async (req, res) => {
        try {
            const username = req.user.username

            const blockedList = await blockService.getBlockedList(username)

            res.status(200).json(blockedList)
        } catch (error) {
            handelErrorResponse(res, error)
        }
    });

    /**
    * @swagger
    * /block/{username}:
    *   get:
    *     summary: check block 
    *     description: check block
    *     tags:
    *       - Block
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
            const blockerUser = req.user.username
            const blockingUser = req.params.username.trim()
            if(!isUsername(blockingUser)){
                throw new HttpError(400, "check user name Field")
            }

            const blocked = await blockService.checkBlock(blockingUser, blockerUser)

            return res.status(200).json({blocked})
        } catch (error) {
            handelErrorResponse(res,error)
        }
    });

    /**
    * @swagger
    * /block/loginUser/{username}:
    *   get:
    *     summary: check user blocked by someone
    *     description: check block
    *     tags:
    *       - Block
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
    router.get("/loginUser/:username", authMiddleware, async(req, res) => {
        try {
            const blockingUser = req.user.username
            const blockerUser = req.params.username.trim()
            if(!isUsername(blockerUser)){
                throw new HttpError(400, "check user name Field")
            }

            const blocked = await blockService.checkBlock(blockingUser, blockerUser)

            return res.status(200).json({blocked})
        } catch (error) {
            handelErrorResponse(res,error)
        }
    });

   /**
 * @swagger
 * /block:
 *   post:
 *     summary: block a user
 *     description: block a user
 *     tags:
 *       - Block
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - blockerUsername
 *             properties:
 *               blockingUsername:
 *                 type: string
 *                 example: johndoe
 *     responses:
 *       200:
 *         description: blocked
 */
    router.post("", authMiddleware, async (req, res, next) => {
        try {
            const blockerUser: Username = req.user.username
            if(!blockerUser) {
                throw new HttpError(400, "user not found.") 
            }

            const blockingUser = blockDto.parse(req.body)
            await blockService.block(blockingUser.blockingUsername, blockerUser)
            res.status(200).json({message:"user blockd."})
        } catch (error) {
            handelErrorResponse(res, error)
        }
    })

    /**
     * @swagger
     * /block:
     *   delete:
     *     summary: unblock a user
     *     description: unblock a user
     *     tags:
     *       - Block
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - blockingUsername
     *             properties:
     *               blockingUsername:
     *                 type: string
     *                 example: johndoe
     *     responses:
     *       200:
     *         description: blocked
     */
    router.delete("", authMiddleware, async (req, res, next) => {
        try {
            const blockerUser: Username = req.user.username
            if(!blockerUser) {
                throw new HttpError(400, "user not found.") 
            }

            const blockingUser = blockDto.parse(req.body)
            await blockService.unblock(blockingUser.blockingUsername, blockerUser)
            res.status(200).json({message:"user unblocked."})
        } catch (error) {
            handelErrorResponse(res, error)
        }
    })

    return router
}
 
