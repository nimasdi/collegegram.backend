import { Router, Request, Response } from 'express';
import { UserService } from '../services/User.service';
import { createUser } from "../repositrory/user/user.repositroy";
import { createUserDto } from "../dto/createUser.dto";
import { Username, isEmail, isUsername } from '../types/user.types';
import authMiddleware from '../utility/authorization';
import { handelErrorResponse } from '../utility/habdle-errResponse';
import { ZodError } from 'zod';
import { createPostDto } from '../dto/createPost.dto';
import multer from 'multer';
import { updatePostDto } from '../dto/updatePostdto';


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
     * /resetPassword/{identifier}:
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
    *   /{username}/createPost:
    *     post:
    *       summary: Create a new post for a user
    *       description: Endpoint to create a new post for a user specified by the username in the path parameter.
    *       parameters:
    *         - in: path
    *           name: username
    *           required: true
    *           description: The username of the user for whom the post is being created.
    *           schema:
    *             type: string
    *       requestBody:
    *         description: Data required to create a new post.
    *         required: true
    *         content:
    *           application/json:
    *             schema:
    *               type: object
    *               properties:
    *                 images:
    *                   type: array
    *                   items:
    *                     type: string
    *                   example: ["test"]
    *                 caption:
    *                   type: string
    *                   example: "hdhdhdh #dgdg dhdhdh"
    *                 mentionsUsernames:
    *                   type: array
    *                   items:
    *                     type: string
    *                   example: ["aashshshaa"]
    *               required:
    *                 - images
    *                 - caption
    *                 - mentionsUsernames
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
    router.post('/:username/createPost', authMiddleware, async (req, res, next) => {
        try {

            const username = req.params.username
            const postData = createPostDto.parse(req.body)

            userService.createPost(username, postData);

            res.status(200).send({ message: 'Post created successfully' })

        } catch (error) {
            handelErrorResponse(res, error)
        }
    })

    /**
    * @swagger
    * openapi: 3.0.0
    * info:
    *   title: Post API
    *   version: 1.0.0
    *   description: API for managing posts, including updating a post.
    * paths:
    *   /{username}/{postid}/update:
    *     post:
    *       summary: Update a post for a user
    *       description: Endpoint to update an existing post for a user specified by the username and postId in the path parameters.
    *       parameters:
    *         - in: path
    *           name: username
    *           required: true
    *           description: The username of the user whose post is being updated.
    *           schema:
    *             type: string
    *         - in: path
    *           name: postid
    *           required: true
    *           description: The ID of the post to be updated.
    *           schema:
    *             type: string
    *       requestBody:
    *         description: Data required to update the post.
    *         required: true
    *         content:
    *           application/json:
    *             schema:
    *               type: object
    *               properties:
    *                 images:
    *                   type: array
    *                   items:
    *                     type: string
    *                   example: ["base64ImageString"]
    *                 caption:
    *                   type: string
    *                   example: "Updated caption with #tags"
    *                 mentionsUsernames:
    *                   type: array
    *                   items:
    *                     type: string
    *                   example: ["mentionedUsername"]
    *               required:
    *                 - images
    *                 - caption
    *                 - mentionsUsernames
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
    router.post('/:username/:postid/update', authMiddleware ,  async (req, res, next) => {
        try {

            const username = req.params.username;
            const postId = req.params.postid;
            const postData = updatePostDto.parse(req.body)

            userService.updatePost(username, postId,postData);

            res.status(200).send({ message: 'Post updated successfully' })

        } catch (error) {
            handelErrorResponse(res, error)
        }
    })
    

    /**
     * @swagger
     * /userUpdate/{username}:
     *   put:
     *     summary: Update user information
     *     description: Update the user information including an optional profile image.
     *     parameters:
     *       - in: path
     *         name: username
     *         required: true
     *         schema:
     *           type: string
     *         description: Username of the user to update
     *     requestBody:
     *       content:
     *         application/json:
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
    const upload = multer({ dest: 'uploads/images/' });
    router.put('/userUpdate/:username', authMiddleware, upload.single('image'), async (req: Request, res: Response) => {
        try {
            const username = req.params.username as Username;
            const updatedData = JSON.parse(req.body.otherData); 
            const file = req.file;

            const updatedUser = await userService.updateUserInformation(username, updatedData, file);

            if (updatedUser) {
                res.status(200).json(updatedUser);
            } else {
                res.status(404).json({ message: 'User not found' });
            }
        } catch (error) {
            res.status(500).json({ message: "server error" });
        }
    });



    return router;
};