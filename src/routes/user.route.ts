import { Router, Request, Response } from 'express'
import { UserService } from '../services/User.service'
import { createUser } from '../repositrory/user/user.repositroy'
import authMiddleware from '../utility/authorization'
import { handelErrorResponse } from '../utility/habdle-errResponse'
import { upload as uploadMiddleware, upload1 as profileMid } from '../utility/multer'
import path from 'path'
import { createUserDto } from '../dto/createUser.dto'
import { isEmail, isPostId, isUsername, Username } from '../types/user.types'
import { updateUserDto } from '../dto/updateUser.dto'
import { searchUser } from '../dto/searchUser.dto'

export const UserRoute = (userService: UserService) => {
    const router = Router()

    /**
     * @swagger
     * /signup:
     *   post:
     *     summary: User signup
     *     description: Create a new user account.
     *     tags:
     *       - Users
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
    router.post('/signup', async (req, res, next) => {
        try {
            const user: createUser = createUserDto.parse(req.body)
            const userCreated = await userService.createUser(user)
            if (userCreated) {
                res.status(200).json({ message: 'user created' })
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
     *     tags:
     *       - Users
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
        const { usernameOrEmail, password, rememberMe } = req.body

        if (!usernameOrEmail || !password || typeof rememberMe !== 'boolean') {
            return res.status(400).json({ message: 'Invalid request. Please provide username/email, password' })
        }

        try {
            const token = await userService.LoginUser(usernameOrEmail, password, rememberMe)
            // console.log(token)
            if (token) {
                return res.status(200).json({ token })
            } else {
                return res.status(401).json({ message: 'Invalid username or password.' })
            }
        } catch (error) {
            console.error('Error during login:', error)
            return res.status(500).json({ message: 'Internal server error. Please try again later.' })
        }
    })

    /**
     * @swagger
     * /setPassword/{hashedUsername}:
     *   post:
     *     summary: Set user password
     *     description: Set a new password for a user identified by a hashed username.
     *     tags:
     *       - Users
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
    router.post('/setPassword/:hashedUsername', async (req: Request, res: Response) => {
        try {
            const { hashedUsername } = req.params
            const { password } = req.body

            if (!password) {
                return res.status(400).send({
                    success: false,
                    message: 'Password is required',
                })
            }

            const result = await userService.updatePassword(hashedUsername, password)

            if (result) {
                return res.status(200).send({
                    success: true,
                    message: 'Password updated successfully',
                })
            } else {
                return res.status(400).send({
                    success: false,
                    message: 'Failed to update password',
                })
            }
        } catch (error) {
            if (error instanceof Error) {
                return res.status(400).send(error.message)
            }
            return res.status(500).send(error)
        }
    })

    /**
     * @swagger
     * /resetPassword:
     *   post:
     *     summary: Reset user password
     *     description: Sends an email to reset the password for the user identified by username or email.
     *     tags:
     *       - Users
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
    router.post('/resetPassword', async (req: Request, res: Response) => {
        const { identifier } = req.body

        if (!(isUsername(identifier) || isEmail(identifier))) {
            return res.status(400).send({
                success: false,
                message: 'نام کاربری  یا ایمیل خود را وارد کنید.',
            })
        }
        try {
            const sendedEamil = await userService.sendEmail(identifier)

            if (sendedEamil) {
                return res.status(200).send({
                    success: true,
                    message: 'ایمیل با موفقیت ارسال شد.',
                })
            } else {
                return res.status(400).send({
                    success: false,
                    message: 'Failed to update password',
                })
            }
        } catch (error) {
            console.log(error)
            return res.status(400).json(error)
        }
    })

    /**
     * @swagger
     * /userInformation/{username}:
     *   get:
     *     summary: Get user information
     *     description: Retrieve detailed information for a user by username.
     *     tags:
     *       - Users
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
        const username = req.params.username as Username
        try {
            const user = await userService.GetUserInformation(username)
            if (user) {
                return res.status(200).json({ user })
            } else {
                return res.status(404).json({ message: 'User not found.' })
            }
        } catch (error) {
            return res.status(500).json({ message: 'Internal server error. Please try again later.' })
        }
    })

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
    router.get('/images/:type/:imageName', (req, res) => {
        const type = req.params.type === 'post' ? 'posts' : req.params.type === 'messages' ? 'messages' : 'images'
        let url = path.join(__dirname, `../../src/uploads/${type}/${req.params.imageName}`)
        res.sendFile(url)
    })

    /**
     * @swagger
     * /userUpdate:
     *   put:
     *     summary: Update user information
     *     description: Update the user information including an optional profile image.
     *     tags:
     *       - Users
     *     requestBody:
     *       content:
     *         multipart/form-data:
     *           schema:
     *             type: object
     *             properties:
     *               firstName:
     *                 type: string
     *                 description: User's first name
     *               lastName:
     *                 type: string
     *                 description: User's last name
     *               email:
     *                 type: string
     *                 format: email
     *                 description: User's email
     *               password:
     *                 type: string
     *                 format: password
     *                 description: User's password
     *               private:
     *                 type: boolean
     *                 description: User's privacy setting
     *               bio:
     *                 type: string
     *                 description: User's bio
     *               image:
     *                 type: string
     *                 format: binary
     *                 description: Optional image file to upload
     *     required: true
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
     *                   properties:
     *                     firstName:
     *                       type: string
     *                     lastName:
     *                       type: string
     *                     email:
     *                       type: string
     *                     private:
     *                       type: boolean
     *                     bio:
     *                       type: string
     *                 imageUrl:
     *                   type: string
     *       404:
     *         description: User not found
     *       500:
     *         description: Server error
     */
    router.put('/userUpdate', authMiddleware, profileMid, async (req: Request, res: Response) => {
        try {
            const username = req.user.username

            const file = req.file as Express.Multer.File

            const image = file.path

            const updatedData = updateUserDto.parse(req.body)

            const updatedUser = await userService.updateUserInformation(username, updatedData, image)

            if (updatedUser) {
                res.status(200).json({ message: 'Ok' })
            } else {
                res.status(404).json({ message: 'User was not updated' })
            }
        } catch (error) {
            handelErrorResponse(res, error)
        }
    })

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
            const { username } = req.params
            const userInfo = await userService.getUserInfoWithoutPosts(username as Username)

            if (!userInfo) {
                return res.status(404).json({ message: 'User not found' })
            }

            res.status(200).json(userInfo)
        } catch (error) {
            res.status(500).json({ message: 'server error' })
        }
    })

    /**
     * @swagger
     * /user/search:
     *   get:
     *     summary: search for a user
     *     description: get the users based on the search text
     *     tags:
     *       - Users
     *     parameters:
     *       - in: query
     *         name: searchText
     *         schema:
     *           type: string
     *         required: true
     *         description: The useranme or first name or last name of the user.
     *       - in: query
     *         name: pageNumber
     *         schema:
     *           type: number
     *           example: 1
     *         required: false
     *         description: The page number to retrieve, defaults to 1.
     *       - in: query
     *         name: pageSize
     *         schema:
     *           type: number
     *           example: 10
     *         required: false
     *         description: The number of comments to retrieve per page, defaults to 10.
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: User information retrieved successfully
     *       content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 firstName:
     *                   type: string
     *                   example: john
     *                 lastName:
     *                   type: string
     *                   example: Doe
     *                 username:
     *                   type: string
     *                   example: johndoe
     *                 folowerCount:
     *                   type: number
     *                   example: 20
     *       404:
     *         description: User not found
     *       500:
     *         description: Internal server error
     */
    router.get('/user/search', authMiddleware , async (req: Request, res: Response) => {
        try {


            const queryParams = searchUser.parse({
                currentUser: req.user.username,
                searchText: req.query.searchText,
                pageNumber: req.query.pageNumber ? parseInt(req.query.pageNumber as string) : undefined,
                pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string) : undefined,
            });

            const searchResults = await userService.searchUser(queryParams.searchText , queryParams.currentUser , queryParams.pageNumber , queryParams.pageSize)

            res.status(200).json(searchResults)
        } catch (error) {
            handelErrorResponse(res,error)
        }
    })

    return router
}
