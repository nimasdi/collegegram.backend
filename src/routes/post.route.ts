import { Router, Request, Response } from 'express';
import authMiddleware from '../utility/authorization';
import { handelErrorResponse } from '../utility/habdle-errResponse';
import { createPostDto } from '../dto/createPost.dto';
import { HttpError } from '../utility/error-handler';
import { upload as uploadMiddleware, upload1 as profileMid } from "../utility/multer"
import { isEmail, isPostId, isUsername, Username } from '../types/user.types';
import { PostService } from '../services/Post.service';
import { likePost , unlikePost} from '../dto/likepPost.dto';
import { savePost, unSavePost } from '../dto/savePost';

export const MakePostRoute = (postService: PostService) => {

    const router = Router();

    /**
    * @swagger
    * openapi: 3.0.0
    * info:
    *   title: User API
    *   version: 1.0.0
    *   description: API for user operations.
    * paths:
    *   /createPost:
    *     post:
    *       summary: Create a new post for a user
    *       description: Endpoint to create a new post for a user specified by the username in the path parameter.
    *       tags:
    *           - Posts
    *       requestBody:
    *         description: Data required to create a new post, including images and other metadata.
    *         required: true
    *         content:
    *           multipart/form-data:
    *             schema:
    *               type: object
    *               properties:
    *                 images:
    *                   type: array
    *                   items:
    *                     type: string
    *                     format: binary
    *                   description: List of image files to be uploaded
    *                 caption:
    *                   type: string
    *                   description: Caption for the post
    *                   example: "hdhdhdh #dgdg dhdhdh"
    *                 mentionsUsernames:
    *                   type: array
    *                   items:
    *                     type: string
    *                   description: List of usernames mentioned in the post. Can be an empty array if no usernames are mentioned.
    *                   example: ["aashshshaa"]
    *               required:
    *                 - images
    *                 - caption
    *               additionalProperties: false
    *       responses:
    *         200:
    *           description: Post created successfully
    *         400:
    *           description: Bad request, possibly due to validation errors
    *         500:
    *           description: Server error
    *       security:
    *         - bearerAuth: []
    * components:
    *   securitySchemes:
    *     bearerAuth:
    *       type: http
    *       scheme: bearer
    *       bearerFormat: JWT
    */
    router.post('/createPost', authMiddleware, uploadMiddleware, async (req, res, next) => {
        try {
            const username = req.user.username;
            const files = req.files as Express.Multer.File[];

            const images = files?.map(file => file.path) || [];

            const postData = createPostDto.parse({
                ...req.body,
                images: images
            });

            await postService.createPost(username, postData);

            res.status(200).send({ message: 'Post created successfully' });
        } catch (error) {
            handelErrorResponse(res, error);
        }
    });

    /**
   * @swagger
   * /posts/{postId}:
   *   get:
   *     summary: Get user posts
   *     description: Retrieve detailed information for a post.
   *     tags:
   *       - Posts
   *     parameters:
   *         - in: path
   *           name: postId
   *           required: true
   *           description: postID
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
    router.get('/posts/:postId', authMiddleware, async (req: Request, res: Response) => {
        try {
            const postId = req.params.postId;
            if (!isPostId(postId)) {
                throw new HttpError(400, "check postid Field")
            }
            const post = await postService.getPostById(postId)
            res.status(200).json({
                post
            })
        } catch (error) {
            handelErrorResponse(res, error)
        }
    });



    /**
    * @swagger
    * openapi: 3.0.0
    * info:
    *   title: Post API
    *   version: 1.0.0
    *   description: API for managing posts, including updating a post.
    * paths:
    *   /{postid}/update:
    *     post:
    *       summary: Update a post for a user
    *       description: Endpoint to update an existing post for a user specified by the username and postId in the path parameters.
    *       tags:
    *           - Posts
    *       parameters:
    *         - in: path
    *           name: postid
    *           required: true
    *           description: The ID of the post to be updated.
    *           schema:
    *             type: string
    *       requestBody:
    *         description: Data required to update the post, including new images and other metadata.
    *         required: true
    *         content:
    *           multipart/form-data:
    *             schema:
    *               type: object
    *               properties:
    *                 images:
    *                   type: array
    *                   items:
    *                     type: string
    *                     format: binary
    *                   description: List of image files to be uploaded
    *                 caption:
    *                   type: string
    *                   description: Updated caption for the post
    *                   example: "Updated caption with #tags"
    *                 mentionsUsernames:
    *                   type: array
    *                   items:
    *                     type: string
    *                   description: List of usernames mentioned in the post. Can be an empty array if no usernames are mentioned.
    *                   example: ["mentionedUsername"]
    *               required:
    *                 - images
    *                 - caption
    *       responses:
    *         200:
    *           description: Post updated successfully
    *         400:
    *           description: Bad request, possibly due to validation errors
    *         500:
    *           description: Server error
    *       security:
    *         - bearerAuth: []
    * components:
    *   securitySchemes:
    *     bearerAuth:
    *       type: http
    *       scheme: bearer
    *       bearerFormat: JWT
    */
    router.post('/:postid/update', authMiddleware, uploadMiddleware, async (req, res, next) => {
        try {

            const username = req.user.username
            const postId = req.params.postid;

            const files = req.files as Express.Multer.File[];

            const images = files?.map((file: Express.Multer.File) => file.path) || [];

            const postData = createPostDto.parse({
                ...req.body,
                images: images
            });

            postService.updatePost(username, postId, postData);

            res.status(200).send({ message: 'Post updated successfully' })

        } catch (error) {
            try{
            handelErrorResponse(res, error)
            } catch (error) {
                res.status(400).send({message: "invalid images"})
            }
        }
    })


    /**
    * @swagger
    * /posts:
    *   get:
    *     summary: Get user posts
    *     description: Retrieve detailed information for a posts of a user by username.
    *     tags:
    *       - Posts
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
    router.get('/posts', authMiddleware, async (req: Request, res: Response) => {
        const username = req.user.username;
        try {
            const posts = await postService.getUserPosts(username);
            res.status(200).json({
                posts
            })
        } catch (error) {
            handelErrorResponse(res, error)
        }
    });


    /**
    * @swagger
    * /{username}/posts:
    *   get:
    *     summary: Get user posts
    *     description: Retrieve detailed information for a posts of a user by username.
    *     tags:
    *       - Posts
    *     parameters:
    *         - in: path
    *           name: username
    *           required: true
    *           description: username
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
    router.get('/:username/posts', authMiddleware, async (req: Request, res: Response) => {
        try {
            const username = req.params.username;
            if (!isUsername(username)) {
                throw new HttpError(400, "check user name Field")
            }
            const posts = await postService.getUserPosts(username);
            res.status(200).json({
                posts
            })
        } catch (error) {
            handelErrorResponse(res, error)
        }
    });


    /**
     * @swagger
     * /likePost:
     *   post:
     *     summary: Like a post
     *     description: Allows authenticated users to like a specific post.
     *     tags:
     *       - Posts
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
     *                 description: The ID of the post to like.
     *             required:
     *               - postId
     *     responses:
     *       200:
     *         description: Post liked successfully
     *       400:
     *         description: Invalid input data, post not found, or user has already liked the post
     *       500:
     *         description: Server error
     */
    router.post('/likePost', authMiddleware, async (req: Request, res: Response) => {
        try {
            const username = req.user.username; // Assuming the username is retrieved from the auth middleware
            const likePostData = likePost.parse({
                username: req.user.username,
                postId: req.body.postId
            })

            const result = await postService.likePost(likePostData);

            res.status(200).send({ success: result, message: "Post liked successfully" });
        } catch (error) {
            handelErrorResponse(res, error);
        }
    });


    /**
     * @swagger
     * /unlikePost:
     *   delete:
     *     summary: Unlike a post
     *     description: Allows authenticated users to unlike a specific post they have previously liked.
     *     tags:
     *       - Posts
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
     *                 description: The ID of the post to like.
     *             required:
     *               - postId
     *     responses:
     *       200:
     *         description: Post unliked successfully
     *       400:
     *         description: Invalid input data, post not found, or user has not liked the post
     *       500:
     *         description: Server error
     */
    router.delete('/unlikePost', authMiddleware, async (req: Request, res: Response) => {
        try {
            
            const unlikePostData = unlikePost.parse({
                username: req.user.username,
                postId: req.body.postId
            })

            const result = await postService.unlikePost(unlikePostData);

            res.status(200).send({ success: result, message: "Post unliked successfully" });
        } catch (error) {
            handelErrorResponse(res, error);
        }
    });



    /**
     * @swagger
     * /savePost:
     *   post:
     *     summary: Save a post
     *     description: Allows authenticated users to save a specific post to their bookmarks.
     *     tags:
     *       - Posts
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
     *                 description: The ID of the post to save.
     *             required:
     *               - postId
     *     responses:
     *       200:
     *         description: Post saved successfully
     *       400:
     *         description: Invalid input data, post not found, or user has already saved the post
     *       500:
     *         description: Server error
     */
    router.post('/savePost', authMiddleware, async (req: Request, res: Response) => {
        try {
            const username = req.user.username; 
            const savePostData = savePost.parse({
                username,
                postId: req.body.postId
            });

            const result = await postService.savePost(savePostData);

            res.status(200).send({ success: result, message: "Post saved successfully" });
        } catch (error) {
            handelErrorResponse(res, error);
        }
    });


    
    /**
     * @swagger
     * /unsavePost:
     *   delete:
     *     summary: Unsave a post
     *     description: Allows user to remove a specific post from their bookmarks.
     *     tags:
     *       - Posts
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
     *                 description: The ID of the post to unsave.
     *             required:
     *               - postId
     *     responses:
     *       200:
     *         description: Post unsaved successfully
     *       400:
     *         description: Invalid input data, post not found, or user has not saved the post
     *       500:
     *         description: Server error
     */
    router.delete('/unsavePost', authMiddleware, async (req: Request, res: Response) => {
        try {
            const username = req.user.username;

            const unsavePostData = unSavePost.parse({
                username,
                postId: req.body.postId
            });

            const result = await postService.unSavePost(unsavePostData);

            res.status(200).send({ success: result, message: "Post unsaved successfully" });
        } catch (error) {
            handelErrorResponse(res, error);
        }
    });



    return router;
};