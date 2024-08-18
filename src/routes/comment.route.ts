import { Router, Request, Response } from 'express';
import { UserService } from '../services/User.service';
import { createUser } from "../repositrory/user/user.repositroy";
import authMiddleware from '../utility/authorization';
import { handelErrorResponse } from '../utility/habdle-errResponse';
import { ZodError } from 'zod';
import { createPostDto } from '../dto/createPost.dto';
import { HttpError } from '../utility/error-handler';
import multer from 'multer';
import { updatePostDto } from '../dto/updatePostdto';
import { upload as uploadMiddleware, upload1 as profileMid } from "../utility/multer"
import { followDto } from '../dto/follow.dto';
import path from 'path';
import { createUserDto } from '../dto/createUser.dto';
import { isEmail, isUsername, Username } from '../types/user.types';
import { CommentService } from '../services/Comment.service';
import { createComment } from '../dto/createComment.dto';
import { replyComment } from '../dto/replyComment.dto';


export const CommentRoute = (commentService: CommentService) => {
    const router = Router();

    /**
     * @swagger
     * /createComment:
     *   post:
     *     summary: Create a comment on a post
     *     description: Allows authenticated users to create a comment on a post.
     *     tags:
     *       - Comments
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               post_id:
     *                 type: string
     *                 example: "64e2c20b5c1d4b3c1a1e7d20"
     *                 description: The ID of the post to comment on.
     *               text:
     *                 type: string
     *                 example: "This is a great post!"
     *                 description: The content of the comment.
     *             required:
     *               - post_id
     *               - text
     *     responses:
     *       200:
     *         description: Comment created successfully
     *       400:
     *         description: Invalid input data or post not found
     *       500:
     *         description: Server error
     */
    router.post('/createComment',authMiddleware ,async (req: Request, res: Response) => {
        try {

            const username = req.user.username;
            const commentData = createComment.parse(req.body)

            const result = await commentService.createComment(username , commentData)

            res.status(200).send(result);


        } catch (error) {
            handelErrorResponse(res, error)
        }
    });


    /**
     * @swagger
     * /replyToComment:
     *   post:
     *     summary: Reply to an existing comment
     *     description: Allows authenticated users to reply to an existing comment on a post.
     *     tags:
     *       - Comments
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               postId:
     *                 type: string
     *                 example: "64e2c20b5c1d4b3c1a1e7d20"
     *                 description: The ID of the post where the comment is being replied to.
     *               parentId:
     *                 type: string
     *                 example: "64e2c20b5c1d4b3c1a1e7f01"
     *                 description: The ID of the parent comment being replied to.
     *               text:
     *                 type: string
     *                 example: "I totally agree with your point!"
     *                 description: The content of the reply comment.
     *             required:
     *               - postId
     *               - parentId
     *               - text
     *     responses:
     *       200:
     *         description: Reply comment created successfully
     *       400:
     *         description: Invalid input data or post/comment not found
     *       500:
     *         description: Server error
     */
    router.post('/replyToComment', authMiddleware, async (req: Request, res: Response) => {
        try {
            const username = req.user.username;
            const replyData = replyComment.parse(req.body); 

            const result = await commentService.replyToComment(username, replyData.postId, replyData);

            res.status(200).send(result);
        } catch (error) {
            handelErrorResponse(res, error);
        }
    });


    return router;


};