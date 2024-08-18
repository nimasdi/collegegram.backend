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
import { upload as uploadMiddleware , upload1 as profileMid } from "../utility/multer"
import { followDto } from '../dto/follow.dto';
import path from 'path';
import { createUserDto } from '../dto/createUser.dto';
import { isEmail, isPostId, isUsername, Username } from '../types/user.types';


export const UserRoute = (userService: UserService) => {
    const router = Router();

    /**
     * @swagger
     * /signup:
     *   post:
     *     summary: User signup
     *     description: Create a new user account.
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - username
     *               - email
     *               - password
     *             properties:
     *               username:
     *                 type: string
     *                 example: johndoe
     *               email:
     *                 type: string
     *                 format: email
     *                 example: johndoe@example.com
     *               password:
     *                 type: string
     *                 example: strongpassword123
     *     responses:
     *       200:
     *         description: Signup successful
     *       400:
     *         description: Invalid input data
     */
    router.post("/signup", async (req, res, next) => {
        try {
            const user: createUser = createUserDto.parse(req.body)
            const userCreated = await userService.createUser(user)
            if (userCreated) {
                res.status(200).json({ "message": "user created" })
            }
        } catch (error) {
            handelErrorResponse(res, error)
        }
    })

    /**
     * @swagger
     * /login:
     *   post:
     *     summary: User login
     *     description: Authenticate a user and return a JWT token.
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               usernameOrEmail:
     *                 type: string
     *               password:
     *                 type: string
     *               rememberMe:
     *                 type: boolean
     *     responses:
     *       200:
     *         description: Login successful, returns JWT token
     *       400:
     *         description: Invalid request, missing or incorrect fields
     *       401:
     *         description: Invalid username or password
     *       500:
     *         description: Internal server error
     */
    router.post('/login', async (req: Request, res: Response) => {
        const { usernameOrEmail, password, rememberMe } = req.body;

        if (!usernameOrEmail || !password || typeof rememberMe !== 'boolean') {
            return res.status(400).json({ message: 'Invalid request. Please provide username/email, password' });
        }

        try {
            const token = await userService.LoginUser(usernameOrEmail, password, rememberMe);
            // console.log(token)
            if (token) {
                return res.status(200).json({ token });
            } else {
                return res.status(401).json({ message: 'Invalid username or password.' });
            }
        } catch (error) {
            console.error("Error during login:", error);
            return res.status(500).json({ message: 'Internal server error. Please try again later.' });
        }
    });

    /**
     * @swagger
     * /setPassword/{hashedUsername}:
     *   post:
     *     summary: Set user password
     *     description: Set a new password for a user identified by a hashed username.
     *     parameters:
     *       - in: path
     *         name: hashedUsername
     *         required: true
     *         schema:
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               password:
     *                 type: string
     *     responses:
     *       200:
     *         description: Password updated successfully
     *       400:
     *         description: Missing or invalid data
     *       500:
     *         description: Internal server error
     */
    router.post("/setPassword/:hashedUsername", async (req: Request, res: Response) => {
        try {
            const { hashedUsername } = req.params;
            const { password } = req.body;

            if (!password) {
                return res.status(400).send({
                    success: false,
                    message: 'Password is required'
                });
            }

            const result = await userService.updatePassword(hashedUsername, password);

            if (result) {
                return res.status(200).send({
                    success: true,
                    message: 'Password updated successfully'
                });
            } else {
                return res.status(400).send({
                    success: false,
                    message: 'Failed to update password'
                });
            }

        } catch (error) {
            if (error instanceof Error) {
                return res.status(400).send(error.message)
            }
            return res.status(500).send(error);
        }
    });

    /**
     * @swagger
     * /resetPassword:
     *   post:
     *     summary: Reset user password
     *     description: Sends an email to reset the password for the user identified by username or email.
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - identifier
     *             properties:
     *               identifier:
     *                 type: string
     *     responses:
     *       200:
     *         description: Email sent successfully
     *       400:
     *         description: Invalid identifier provided
     */
    router.post("/resetPassword", async (req: Request, res: Response) => {
        const { identifier } = req.body;

        if (!(isUsername(identifier) || isEmail(identifier))) {
            return res.status(400).send({
                success: false,
                message: 'نام کاربری  یا ایمیل خود را وارد کنید.'
            });
        }
        try {
            const sendedEamil = await userService.sendEmail(identifier);

            if (sendedEamil) {
                return res.status(200).send({
                    success: true,
                    message: 'ایمیل با موفقیت ارسال شد.'
                });
            } else {
                return res.status(400).send({
                    success: false,
                    message: 'Failed to update password'
                });
            }

        } catch (error) {
            console.log(error)
            return res.status(400).json(error);
        }
    });

    /**
    * @swagger
    * /userInformation/{username}:
    *   get:
    *     summary: Get user information
    *     description: Retrieve detailed information for a user by username.
    *     parameters:
    *       - in: path
    *         name: username
    *         required: true
    *         schema:
    *           type: string
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
    router.get('/userInformation/:username', authMiddleware, async (req: Request, res: Response) => {
        const username = req.params.username as Username;
        try {

            const user = await userService.GetUserInformation(username);
            if (user) {
                return res.status(200).json({ user });
            } else {
                return res.status(404).json({ message: 'User not found.' });
            }
        } catch (error) {
            return res.status(500).json({ message: 'Internal server error. Please try again later.' });
        }
    });

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
    
            await userService.createPost(username, postData);
    
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
            if(!isPostId(postId)){
                throw new HttpError(400, "check postid Field")
            }
            const post = await userService.getPostById(postId)
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

            userService.updatePost(username, postId, postData);

            res.status(200).send({ message: 'Post updated successfully' })

        } catch (error) {
            handelErrorResponse(res, error)
        }
    })

    /**
    * @swagger
    * /posts:
    *   get:
    *     summary: Get user posts
    *     description: Retrieve detailed information for a posts of a user by username.
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
            const posts  = await userService.getUserPosts(username);
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
            if(!isUsername(username)){
                throw new HttpError(400, "check user name Field")
            }
            const posts  = await userService.getUserPosts(username);
            res.status(200).json({
                posts
            })
        } catch (error) {
            handelErrorResponse(res, error)
        }
    }); 

    /**
    * @swagger
    * /images/{type}/{imageName}:
    *   get:
    *     summary: Get post image file
    *     description: Retrieve image file
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
    router.get("/images/:type/:imageName", (req, res) => {
        const type = req.params.type === 'post' ? 'posts' : 'images'
        let url = path.join(
          __dirname,
          `../../src/uploads/${type}/${req.params.imageName}`
        );
        res.sendFile(url);
    });


    /**
     * @swagger
     * /userUpdate:
     *   put:
     *     summary: Update user information
     *     description: Update the user information including an optional profile image.
     *     requestBody:
     *       content:
     *         multipart/form-data:
     *           schema:
     *             type: object
     *             properties:
     *               otherData:
     *                 type: string
     *                 description: JSON string with updated user information
     *               image:
     *                 type: string
     *                 format: binary
     *                 description: Optional image file to upload
     *       required: true
     *     responses:
     *       200:
     *         description: User updated successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 username:
     *                   type: string
     *                   example: johndoe
     *                 updatedData:
     *                   type: object
     *                   additionalProperties: true
     *                 imageUrl:
     *                   type: string
     *                   example: /uploads/images/johndoe-1632760000000.png
     *       404:
     *         description: User not found
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: User not found
     *       500:
     *         description: Server error
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: server error
     */
    router.put('/userUpdate', authMiddleware, profileMid, async (req: Request, res: Response) => {
        try {
            const username = req.user.username;
            const updatedData = JSON.parse(req.body.otherData);
            const file = req.file as Express.Multer.File;
            
            const image = file.path
            const updatedUser = await userService.updateUserInformation(username, updatedData, image);

            if (updatedUser) {
                res.status(200).json(updatedUser);
            } else {
                res.status(404).json({ message: 'User not found' });
            }
        } 
        catch (error) {
            console.log(error);
            res.status(500).json(error);
        }
    });

    /**
     * @swagger
     * /user-info/{username}:
     *   get:
     *     summary: Get user information without posts
     *     description: Retrieves basic information about a user based on their username, excluding any posts.
     *     tags:
     *       - Users
     *     parameters:
     *       - in: path
     *         name: username
     *         required: true
     *         description: The username of the user whose information is to be retrieved.
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Successful response with user information
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 username:
     *                   type: string
     *                   example: johndoe
     *                 fullName:
     *                   type: string
     *                   example: John Doe
     *                 email:
     *                   type: string
     *                   example: johndoe@example.com
     *                 # Add more fields as returned by the userService.getUserInfoWithoutPosts method
     *       404:
     *         description: User not found
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: User not found
     *       500:
     *         description: Server error
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: Server error
     */

    router.get('/user-info/:username', async (req: Request, res: Response) => {
        try {
            const { username } = req.params;
            const userInfo = await userService.getUserInfoWithoutPosts(username as Username);

            if (!userInfo) {
                return res.status(404).json({ message: 'User not found' });
            }

            res.status(200).json(userInfo);
        } catch (error) {
            res.status(500).json({ message: "server error" });
        }
    });


    return router;
};