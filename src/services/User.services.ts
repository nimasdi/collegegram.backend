import { md5 } from "js-md5";
import { IUser, User } from "../db/user/user.model";
import { loginUser, UserRepository } from "../repositrory/user/user.repositroy";
import { Email, isEmail, isUsername, Name, Password, Username } from "../types/user.types";
import dotenv from 'dotenv';
import { sign } from "jsonwebtoken";



type UsernameOrEmail = Username | Email;



dotenv.config();


const JWT_SECRET = process.env.JWT_SECRET as string;



if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined");
}


export class UserService {
    constructor(
        private userRepo: UserRepository
    ) {
    }

    async LoginUser(usernameOrEmail: UsernameOrEmail, password: Password, rememberMe: boolean): Promise<string | null> {


        let user: loginUser | null = null;

        if (isUsername(usernameOrEmail)) {
            user = await this.userRepo.getUserPasswordByUsername(usernameOrEmail);
        } else if (isEmail(usernameOrEmail)) {
            user = await this.userRepo.getUserPasswordByEmail(usernameOrEmail);
        }

        if (user) {
            const hashedPasswordFromClient = md5(password);
            if (hashedPasswordFromClient === user.password) {
                const expiresIn = rememberMe ? '30d' : '1d';
                const token = sign({ username: user.username }, JWT_SECRET, { expiresIn });
                return token;
            }
            return null;
        }
        return null;
    }
}