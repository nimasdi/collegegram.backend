import { md5 } from "js-md5";
import { IUser, User } from "../db/user/user.model";
import { createUser, loginUser, loginUserResponse, UserRepository } from "../repositrory/user/user.repositroy";
import { Email, isEmail, isPassword, isUsername, Name, Password, Username } from "../types/user.types";
import dotenv from 'dotenv';
import { sign } from "jsonwebtoken";
import { decodeUsernameWithSalt } from "../utility/decode";
import { sendEmail } from "../utility/mailer";


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

    async createUser(userData : createUser): Promise<Boolean> {
        const user = await this.userRepo.createUser(userData);
        return true
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

    async updatePassword(encodedUsername: string, password: string) {

        const username = decodeUsernameWithSalt(encodedUsername);

        if (!isUsername(username)) {
            throw new Error("invalid username")
        }
        if (!isPassword(password)) {
            throw new Error("invalid password")
        }

        const hashedPassword = md5(password) as Password;

        const user = await this.userRepo.UpdatePassword(username, hashedPassword)

        return true;
    }

    async sendEmail(username:Username): Promise<Boolean> {
        const user = await this.userRepo.getUserByUsername(username)

        if(!user){
            return false
        }

        const encodedUsername = decodeUsernameWithSalt(username);
        const resetPassLink = `https://url/setPassword/${encodedUsername}`
    
        // Send a welcome email after successful registration
        await sendEmail(user.email, 'Reset Password', 'reset yout password', `<h1>${resetPassLink}</h1>`);
        return true
    };

    async getUserInformation(username : Username)  : Promise<loginUserResponse | null> {
        const user = await this.userRepo.getUserByUsername(username);
        return user;
    }
}




