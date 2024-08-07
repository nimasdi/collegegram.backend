import { Router, Request, Response } from 'express';
import { UserService } from '../services/User.service';
import { createUser } from "../repositrory/user/user.repositroy";
import { createUserDto } from "../dto/user.dto";
import { Username } from '../types/user.types';
import authMiddleware from '../utility/authorization';

export const UserRoute = (userService: UserService) => {
    const router = Router();

    router.post("/signup",async (req,res,next) => {
        try {
            const user: createUser = createUserDto.parse(req)
            const userCreated = await userService.createUser(user)
            if(userCreated){
                res.status(200).json({"message" : "ثبت نام با موفقیت انجام شد."})
            }
        } catch (error) {
            res.status(400).json({"message":"bad !"})
        }
    })

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
            return res.status(400).json(error);
        }
    });

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
