import { md5 } from "js-md5";
import { createUser, dataUserResponse, loginUser, loginUserResponse, updateUser, UserRepository } from "../repositrory/user/user.repositroy";
import { Email, isEmail, isPassword, isUsername, Name, Password, Username, UserWithoutPosts } from "../types/user.types";
import dotenv from 'dotenv';
import { sign } from "jsonwebtoken";
import { decodeUsernameWithSalt, encodeIdentifierWithSalt } from "../utility/decode";
import { sendEmail } from "../utility/mailer";
import path from "path";
import fs from 'fs';
import { HttpError } from "../utility/error-handler";
import { extractTags } from "../utility/extractTags";
import { createPost, PostRepository, PostResponse, updatePost } from "../repositrory/post/post.repository";
import { Types } from "mongoose";


export type userCreatePostData = {
    images: string[],
    caption: string,
    mentionsUsernames: string,
}

export type userUpdatePost = {
    images: string[],
    caption: string,
    mentionsUsernames: string
}

type UsernameOrEmail = Username | Email;



const JWT_SECRET = process.env.JWT_SECRET as string;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;


if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined");
}


export class UserService {

    constructor(private userRepo: UserRepository, private postRepo: PostRepository) {
    }

    async createUser(userData: createUser): Promise<Boolean> {
        userData.password = md5(userData.password) as Password;
        const userExist = await this.userRepo.checkUserExist(userData.email) || await this.userRepo.checkUserExist(userData.username)
        if (userExist) {
            throw new HttpError(400, "user exist before")
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

    async createPost(username: string, postData: userCreatePostData): Promise<true | null> {
        if (!isUsername(username)) {
            throw new HttpError(400, "Invalid username");
        }

        const user = await this.userRepo.getUserByUsername(username);

        if (!user) {
            throw new HttpError(400, "User not found");
        }

        // Check and save images
        if (!postData.images || postData.images.length === 0) {
            throw new HttpError(400, "You haven't uploaded any images");
        }

        const imageUrls = postData.images.map(image => {
            return `http://5.34.195.108:3000/images/post/${path.basename(image)}`;
        });

        const mentionsUsernames = this.convertToArray(postData.mentionsUsernames)

        // Validate mentions
        const mentions: Username[] = [];
        if (mentionsUsernames && mentionsUsernames.length > 0) {
            for (const mentionedUsername of mentionsUsernames) {
                if (!isUsername(mentionedUsername)) {
                    throw new HttpError(400, `Invalid username: ${mentionedUsername}`);
                }

                // Check if the username exists in the database
                const mentionedUser = await this.userRepo.getUserByUsername(mentionedUsername);
                if (!mentionedUser) {
                    throw new HttpError(400, `User not found: ${mentionedUsername}`);
                }

                mentions.push(mentionedUsername);
            }
        }

        // Extract tags from caption
        const tags = extractTags(postData.caption);

        const postData2: Omit<createPost, 'createdAt'> = {
            ...postData,
            tags,
            images: imageUrls,
            mentions,
        };

        const userId = await this.userRepo.getUserIdByUsername(username);

        if (!userId) {
            throw new HttpError(500, "User ID not found");
        }


        const createdPost = await this.postRepo.createPost(postData2, userId);

        if (createdPost) {
            return true;
        }


        return null;
    }

    async updateUserInformation(username: string, updatedData: updateUser, imageFile?: string): Promise<updateUser | null> {

        if (!isUsername(username)) {
            throw new HttpError(400, "Invalid username");
        }

        // const user = await this.userRepo.getUserByUsername(username);

        // if (!user) {
        //     throw new HttpError(404, 'User not found');
        // }

        const dataaaa = {
            ...updatedData,
            imageUrl: ""
        }

        if (imageFile) {
    
            dataaaa.imageUrl = `http://5.34.195.108:3000/images/profile/${path.basename(imageFile)}`

        }

        const updatedUser = await this.userRepo.updateUser(username, dataaaa);

        return updatedUser;
    }

    async getUserInfoWithoutPosts(username: Username): Promise<UserWithoutPosts | null> {
        const user = await this.userRepo.getUserByUsername(username);

        if (!user) {
            throw new HttpError(404, 'User not found');
        }
        const {...userWithoutPosts } = user;

        return userWithoutPosts as UserWithoutPosts;
    }

    async updatePost(username: string, postId: string, postData: userUpdatePost) {
        if (!isUsername(username)) {
            throw new HttpError(400, "Invalid username");
        }
    
        const user = await this.userRepo.getUserByUsername(username);
        if (!user) {
            throw new HttpError(400, "User not found");
        }
    
        const post = await this.postRepo.findById(postId);
        if (!post) {
            throw new HttpError(400, "Post not found");
        }
    
        // Delete old images
        if (post.images && post.images.length > 0) {
            for (const oldImagePath of post.images) {
                const absolutePath = path.join(__dirname, '..', oldImagePath);
                if (fs.existsSync(absolutePath)) {
                    fs.unlinkSync(absolutePath);
                }
            }
        }
    
        let imageUrls: string[] = [];
        if (postData.images && postData.images.length > 0) {
            imageUrls = postData.images.map(image => {
                return `http://5.34.195.108:3000/images/post/${path.basename(image)}`;
            });
        } else {
            throw new HttpError(400, "You can't have a post without any images");
        }
    
        const mentionsUsernames = this.convertToArray(postData.mentionsUsernames);
    
        // Validate and process mentions
        const mentions: Username[] = [];
        if (mentionsUsernames && mentionsUsernames.length > 0) {
            for (const mentionedUsername of mentionsUsernames) {
                if (!isUsername(mentionedUsername)) {
                    throw new HttpError(400, `Invalid username: ${mentionedUsername}`);
                }
    
                const mentionedUser = await this.userRepo.getUserByUsername(mentionedUsername);
                if (!mentionedUser) {
                    throw new HttpError(400, `User not found: ${mentionedUsername}`);
                }
    
                mentions.push(mentionedUsername);
            }
        }
    
        // Extract tags from caption
        const tags = extractTags(postData.caption);
    
        const updateData: updatePost = {
            images: imageUrls, 
            caption: postData.caption,
            tags,
            mentions,
        };
    

        const result = await this.postRepo.updatePost(postId, updateData);
        if (!result) {
            throw new HttpError(400, 'Failed to update the post');
        }
    
        return true;
    }
    

    async getUserPosts(username: Username) : Promise<PostResponse[]>{

        const userId = await this.userRepo.getUserIdByUsername(username)
        if(!userId) 
            throw new HttpError(404,"user not found.")

        const posts = await this.postRepo.getAll(userId)
        if(posts.length === 0)
            return []

        return posts
    }


    convertToArray(commaSeparatedString:string) : string[] {
        if (commaSeparatedString === '') {
            return [];
        }
        return commaSeparatedString.split(',').map(item => item.trim());
    }

    async follow(followingUsername: Username, followerUsername: Username) : Promise<void> {
        const follwingUserExist = this.userRepo.getUserByUsername(followingUsername)
        if(!follwingUserExist){
            throw new HttpError(400,"user not found")
        }
        await this.userRepo.addFollowerAndFollowing(followerUsername, followingUsername)
    }

    async unfollow(followingUsername: Username, followerUsername: Username) : Promise<void> {
        const follwingUserExist = this.userRepo.getUserByUsername(followingUsername)
        if(!follwingUserExist){
            throw new HttpError(400,"user not found")
        }
        await this.userRepo.removeFollowerAndFollowing(followerUsername, followingUsername)

    }

    async checkFollow(followingUsername: Username, followerUsername: Username) : Promise<Boolean>{
        const followed = await this.userRepo.checkFollow(followerUsername, followingUsername)
        return followed 
    }
}






