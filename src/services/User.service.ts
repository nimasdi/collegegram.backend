import { md5 } from "js-md5";
import { createUser, dataUserResponse, loginUser, loginUserResponse, updateUser, UserRepository } from "../repositrory/user/user.repositroy";
import { Email, isEmail, isPassword, isUsername, Name, Password, Username } from "../types/user.types";
import dotenv from 'dotenv';
import { sign } from "jsonwebtoken";
import { decodeUsernameWithSalt, encodeIdentifierWithSalt } from "../utility/decode";
import { sendEmail } from "../utility/mailer";
import path from "path";
import fs from 'fs';


type UsernameOrEmail = Username | Email;



dotenv.config();


const JWT_SECRET = process.env.JWT_SECRET as string;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; 


if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined");
}


export class UserService {
    constructor(
        private userRepo: UserRepository
    ) {
    }

    async createUser(userData : createUser): Promise<Boolean> {
        userData.password =  md5(userData.password) as Password;
        await this.userRepo.createUser(userData);
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

    async sendEmail(identifier:Username | Email): Promise<Boolean> {
        let user : loginUserResponse | null;
        if(isUsername(identifier)){
            user = await this.userRepo.getUserByUsername(identifier)
        }else{
            user = await this.userRepo.getUserPasswordByEmail(identifier)
        }

        if(!user){
            return false
        }

        const encodedIdentifier = encodeIdentifierWithSalt(user.username);
        const resetPassLink = `https://5.34.195.108/setPassword/${encodedIdentifier}`
    
        // Send a welcome email after successful registration
        await sendEmail(user.email, 'Reset Password', 'reset yout password', `<h1>${resetPassLink}</h1>`);
        return true
    };

    async GetUserInformation(username : Username)  : Promise<loginUserResponse | null> {
        const user = await this.userRepo.getUserByUsername(username);
        return user;
    }

    async updateUserInformation(username: Username, updatedData: updateUser, base64Image?: string): Promise<updateUser | null> {
        const user = await this.userRepo.getUserByUsername(username);

        if (!user) {
            throw new Error('User not found');
        }
        if(base64Image){
            const base64ImageSize = (base64Image.length * 3) / 4 - (base64Image.includes('==') ? 2 : base64Image.includes('=') ? 1 : 0);

            if (base64ImageSize > MAX_IMAGE_SIZE) {
                throw new Error('Image exceeds maximum size of 5MB');
            }
        }
    
        if (base64Image) {
            const imageDir = path.join(__dirname, '..', 'uploads', 'images');
            if (!fs.existsSync(imageDir)) {
                fs.mkdirSync(imageDir, { recursive: true });
            }

            const filename = `${username}-${Date.now()}.png`;
            const imagePath = path.join(imageDir, filename);


            const imageBuffer = Buffer.from(base64Image, 'base64');
            fs.writeFileSync(imagePath, imageBuffer);

            updatedData.imageUrl = `/uploads/images/${filename}`;
        }

        const updatedUser = await this.userRepo.updateUser(username, updatedData);

        return updatedUser;
    }

}




