import { Router, Request, Response } from 'express';
import { UserService } from '../services/User.service';
import { createUser } from "../repositrory/user/user.repositroy";
import { createUserDto } from "../dto/user.dto";
import { Username, isEmail, isUsername } from '../types/user.types';
import authMiddleware from '../utility/authorization';

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
    router.post("/signup",async (req,res,next) => {
        try {
            const user: createUser = createUserDto.parse(req.body)
            const userCreated = await userService.createUser(user)
            if(userCreated){
                res.status(200).json({"message" : "ثبت نام با موفقیت انجام شد."})
            }
        } catch (error) {
            res.status(400).json({"message":"bad !"})
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
            return res.status(500).json(error);
        }
    });

    /**
     * @swagger
     * /resetPassword/{identifier}:
     *   get:
     *     summary: Reset user password
     *     description: Sends an email to reset the password for the user identified by username or email.
     *     parameters:
     *       - in: path
     *         name: identifier
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Email sent successfully
     *       400:
     *         description: Invalid identifier provided
     */
    router.get("/resetPassword/:identifier", async (req: Request, res: Response) => {
        const { identifier } = req.params;

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
     *     responses:
     *       200:
     *         description: User information retrieved successfully
     *       404:
     *         description: User not found
     *       500:
     *         description: Internal server error
     */
    router.get('/userInformation/:username' , authMiddleware, async(req : Request , res : Response ) => {
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
     * /userUpdate/{username}:
     *   put:
     *     summary: Update user information
     *     description: Update the information for an existing user identified by username.
     *     parameters:
     *       - in: path
     *         name: username
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
     *               name:
     *                 type: string
     *               email:
     *                 type: string
     *     responses:
     *       200:
     *         description: User information updated successfully
     *       404:
     *         description: User not found
     *       500:
     *         description: Internal server error
     */
    router.put('/userUpdate/:username', authMiddleware, async (req: Request, res: Response) => {
        try {
            const username = req.params.username as Username;
            const updatedData = req.body;
            const updatedUser = await userService.UpdateUserInformation(username, updatedData);
            if (updatedUser) {
                res.status(200).json(updatedUser);
            } else {
                res.status(404).json({ message: 'User not found' });
            }
        } catch (error) {
            res.status(500).json({ message: 'Internal server error' });
        }
    });

    return router;
};
