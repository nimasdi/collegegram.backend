import { md5 } from "js-md5";
import { createPost, createUser, dataUserResponse, loginUser, loginUserResponse, updateUser, UserRepository } from "../repositrory/user/user.repositroy";
import { Email, isEmail, isPassword, isUsername, Name, Password, Username } from "../types/user.types";
import dotenv from 'dotenv';
import { sign } from "jsonwebtoken";
import { decodeUsernameWithSalt, encodeIdentifierWithSalt } from "../utility/decode";
import { sendEmail } from "../utility/mailer";
import path from "path";
import fs from 'fs';
import { HttpError } from "../utility/error-handler";
import { extractTags } from "../utility/extractTags";

export type userCreatePostData = {
    images: string[],
    caption: string,
    mentionsUsernames: string[],
}

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

    async createUser(userData: createUser): Promise<Boolean> {
        userData.password = md5(userData.password) as Password;
        const userExist = await this.userRepo.checkUserExist(userData.email) || await this.userRepo.checkUserExist(userData.username)
        if(userExist){
            throw new HttpError(400,"user exist before")
        }
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

    async sendEmail(identifier: Username | Email): Promise<Boolean> {
        let user: loginUserResponse | null;
        if (isUsername(identifier)) {
            user = await this.userRepo.getUserByUsername(identifier)
        } else {
            user = await this.userRepo.getUserPasswordByEmail(identifier)
        }

        if (!user) {
            return false
        }

        const encodedIdentifier = encodeIdentifierWithSalt(user.username);
        const resetPassLink = `https://5.34.195.108/setPassword/${encodedIdentifier}`

        // Send a welcome email after successful registration
        await sendEmail(user.email, 'Reset Password', 'reset yout password', `<h1>${resetPassLink}</h1>`);
        return true
    };

    async GetUserInformation(username: Username): Promise<loginUserResponse | null> {
        const user = await this.userRepo.getUserByUsername(username);
        return user;
    }

    async createPost(username: string, postData: userCreatePostData) {

        if(!isUsername(username)) {
            throw new Error("invalid username")
        }
        
        const user = await this.userRepo.getUserByUsername(username);

        if (!user) {
            throw new Error('User not found');
        }

        if (postData.images && postData.images.length > 0) {
            const imageDir = path.join(__dirname, '..', 'uploads', 'posts');

            if (!fs.existsSync(imageDir)) {
                fs.mkdirSync(imageDir, { recursive: true });
            }

            const imagePaths: string[] = [];

            for (const base64Image of postData.images) {
                const base64ImageSize = (base64Image.length * 3) / 4 - (base64Image.includes('==') ? 2 : base64Image.includes('=') ? 1 : 0);

                if (base64ImageSize > MAX_IMAGE_SIZE) {
                    throw new Error('One or more images exceed the maximum size of 5MB');
                }

                const filename = `${username}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.png`; // Add a random string for uniqueness
                const imagePath = path.join(imageDir, filename);
                const imageBuffer = Buffer.from(base64Image, 'base64');

                fs.writeFileSync(imagePath, imageBuffer);

                imagePaths.push(`/uploads/posts/${filename}`);
            }

            postData.images = imagePaths;
        }
        else {
            throw new Error("You havent uploaded any images");
        }

        const mentions: Username[] = [];

        if (postData.mentionsUsernames && postData.mentionsUsernames.length > 0) {

            for (const mentionedUsername of postData.mentionsUsernames) {
                if (!isUsername(mentionedUsername)) {
                    throw new Error(`Invalid username format: ${mentionedUsername}`);
                }

                // Check if the username exists in the database
                const mentionedUser = await this.userRepo.getUserByUsername(mentionedUsername);
                if (!mentionedUser) {
                    throw new Error(`User not found: ${mentionedUsername}`);
                }

                mentions.push(mentionedUsername as Username);
            }

        }

        const tags = extractTags(postData.caption);

        const { mentionsUsernames, ...postDataWithoutDescription } = postData;
        const postDataWithDate = { mentions, tags, createdAt: new Date(), ...postDataWithoutDescription };

        const createdPost = await this.userRepo.createPost(username, postDataWithDate);

        return createdPost;
    }


    
    
    async updateUserInformation(username: Username, updatedData: updateUser, imageFile?: Express.Multer.File): Promise<updateUser | null> {
        const user = await this.userRepo.getUserByUsername(username);
    
        if (!user) {
            throw new Error('User not found');
        }
    
        if (imageFile) {
    
            if (imageFile.size > MAX_IMAGE_SIZE) {
                throw new Error('Image exceeds maximum size of 5MB');
            }
    
            const imageDir = path.join(__dirname, '..' ,'..', 'uploads', 'images');
            if (!fs.existsSync(imageDir)) {
                fs.mkdirSync(imageDir, { recursive: true });
            }
    
            const filename = `${username}-${Date.now()}${path.extname(imageFile.originalname)}`;
            const imagePath = path.join(imageDir, filename);
    
            fs.renameSync(imageFile.path, imagePath);
    
            updatedData.imageUrl = `/uploads/images/${filename}`;
        }
    
        const updatedUser = await this.userRepo.updateUser(username, updatedData);
    
        return updatedUser;
    }
    




}








