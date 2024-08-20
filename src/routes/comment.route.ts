import { Router, Request, Response } from 'express';
import authMiddleware from '../utility/authorization';
import { handelErrorResponse } from '../utility/habdle-errResponse';
import { CommentService } from '../services/Comment.service';
import { createComment } from '../dto/createComment.dto';
import { replyComment } from '../dto/replyComment.dto';
import { likeComment } from '../dto/likeComment.dto';


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
    router.post('/createComment', authMiddleware, async (req: Request, res: Response) => {
        try {

            const username = req.user.username;
            const commentData = createComment.parse(req.body)

            const result = await commentService.createComment(username, commentData)

            if (!result.success) {
                res.status(400).send(result);
            }
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

            if (!result.success) {
                res.status(400).send(result);
            }
            res.status(200).send(result);
        } catch (error) {
            handelErrorResponse(res, error);
        }
    });

    /**
     * @swagger
     * /likeComment:
     *   post:
     *     summary: Like a comment
     *     description: Allows authenticated users to like a comment.
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
     *               commentId:
     *                 type: string
     *                 example: "64e2c20b5c1d4b3c1a1e7f01"
     *                 description: The ID of the comment to like.
     *               postId:
     *                 type: string
     *                 example: "64e2c20b5c1d4b3c1a1e7d20"
     *                 description: The ID of the post where the comment is located.
     *             required:
     *               - commentId
     *               - postId
     *     responses:
     *       200:
     *         description: Comment liked successfully
     *       400:
     *         description: Invalid input data or comment not found
     *       500:
     *         description: Server error
     */
    router.post('/likeComment', authMiddleware, async (req: Request, res: Response) => {
        try {

            const username = req.user.username;
            const data = { ...req.body, username }

            const likeCommentData = likeComment.parse(data);

            const result = await commentService.likeAComment(likeCommentData);

            res.status(200).send("Comment liked successfully");

        } catch (error) {
            handelErrorResponse(res, error);
        }
    });


    /**
     * @swagger
     * /unlikeComment:
     *   post:
     *     summary: Unlike a comment
     *     description: Allows authenticated users to unlike a comment.
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
     *               commentId:
     *                 type: string
     *                 example: "64e2c20b5c1d4b3c1a1e7f01"
     *                 description: The ID of the comment to unlike.
     *               postId:
     *                 type: string
     *                 example: "64e2c20b5c1d4b3c1a1e7d20"
     *                 description: The ID of the post where the comment is located.
     *             required:
     *               - commentId
     *               - postId
     *     responses:
     *       200:
     *         description: Comment unliked successfully
     *       400:
     *         description: Invalid input data or comment not found
     *       500:
     *         description: Server error
     */
    router.post('/unlikeComment', authMiddleware, async (req: Request, res: Response) => {
        try {

            const username = req.user.username;
            const data = { ...req.body, username }

            const likeCommentData = likeComment.parse(data);

            const result = await commentService.unlikeAComment(likeCommentData);

            res.status(200).send("Comment unliked successfully");

        } catch (error) {
            handelErrorResponse(res, error);
        }
    });


    /**
    * @swagger
    * /userLikes:
    *   get:
    *     summary: Get all liked comments of the user on a specific post
    *     description: Retrieves all the comments liked by the user on a specific post.
    *     tags:
    *       - Comments
    *     security:
    *       - bearerAuth: []
    *     parameters:
    *       - in: query
    *         name: postId
    *         schema:
    *           type: string
    *           example: "64e2c20b5c1d4b3c1a1e7d20"
    *         required: true
    *         description: The ID of the post to retrieve liked comments for.
    *     responses:
    *       200:
    *         description: Liked comments retrieved successfully
    *         content:
    *           application/json:
    *             schema:
    *               type: array
    *               items:
    *                 type: string
    *                 description: The ID of the liked comment
    *       400:
    *         description: Invalid input data or post not found
    *       500:
    *         description: Server error
    */
    router.get('/userLikes', authMiddleware, async (req: Request, res: Response) => {
        try {
            const username = req.user.username;

            const postId = req.query.postId as string;
            if (!postId) {
                return res.status(400).send("Post ID is required");
            }

            const result = await commentService.getUserLikedComments(username, postId);

            res.status(200).json(result);

        } catch (error) {
            handelErrorResponse(res, error);
        }
    });


    return router;


};