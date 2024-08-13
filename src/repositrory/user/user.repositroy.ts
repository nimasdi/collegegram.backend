import mongoose, {  ClientSession, Model } from "mongoose";
import { IUser } from "../../db/user/user.model";
import { Email, Name, Password, Username } from "../../types/user.types";
import { HttpError } from "../../utility/error-handler";
 
import { v4 } from 'uuid';
import { IPost, postSchema } from "../../db/post/post";

export interface createUser {
    username: Username;
    password: Password;
    email: Email;
}

export interface updateUser {
    firstName: Name;
    lastName: Name;
    username: Username;
    password: Password;
    email: Email;
    private: boolean;
    imageUrl: string;
    bio?: string;
}

export interface loginUser {
    username: Username;
    password: Password;
    email: Email;
}


export interface loginUserResponse {
    username: Username;
    password: Password;
    email: Email;
}

export interface dataUserResponse {
    firstName: Name;
    lastName: Name;
    username: Username;
    password: Password;
    email: Email;
    private: boolean;
    imageUrl: string;
    bio?: string;
}

export interface createPost {
    images: string[],
    caption: string,
    tags: string[],
    mentions: Username[],
    createdAt: Date,
}


export class UserRepository {

    private model: Model<IUser>;

    constructor(model: Model<IUser>) {
        this.model = model;
    }

    private handleDBError = () => {
        throw new HttpError(500,'خطای شبکه رخ داده است.')
    }

    private generateDataUserResponse: (user: IUser) => dataUserResponse = (user) => {
        let userResponse: dataUserResponse = {
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            password: user.password,
            email: user.email,
            private: user.private,
            imageUrl: user.imageUrl,
            bio: user.bio,
        }
        return userResponse
    }

    private generateLoginUserResponse: (user: IUser) => loginUserResponse = (user) => {
        let userResponse: loginUserResponse = {
            username: user.username,
            password: user.password,
            email: user.email,
        }
        return userResponse
    }

    async createUser(userData: createUser): Promise<Boolean> {
        const user = new this.model(userData);
        await user.save().catch((err) => this.handleDBError());

        return true
    }

    async getUserByUsername(username: Username): Promise<dataUserResponse | null> {
        const user = await this.model.findOne({ username }, { _id: 0, password: 0 })
            .exec().catch((err) => this.handleDBError());

        if (user) {
            return this.generateDataUserResponse(user)
        }

        return null
    }

    async getUserPasswordByUsername(username: Username): Promise<loginUserResponse | null> {
        const user = await this.model.findOne({ username }, { _id: 0, password: 1, username: 1, email: 1 })
            .exec().catch((err) => this.handleDBError());;

        if (user) {
            return this.generateLoginUserResponse(user)
        }

        return null
    }

    async checkUserExist(identifier: Email | Username): Promise<Boolean> {
        const user = await this.model.findOne({
            $or: [
                { username: identifier },
                { email: identifier }
            ]
        }, { _id: 0, password: 1, username: 1, email: 1 })
            .exec().catch((err) => this.handleDBError());

        if (user) {
            return true
        }

        return false
    }

    async getUserPasswordByEmail(email: Email): Promise<loginUserResponse | null> {
        const user = await this.model.findOne({ email }, { _id: 0, password: 1, username: 1, email: 1 })
            .exec().catch((err) => this.handleDBError());;

        if (user) {
            return this.generateLoginUserResponse(user)
        }

        return null
    }

    async updateUser(username: string, updateData: updateUser): Promise<dataUserResponse | null> {
        const user = await this.model.findOneAndUpdate({ username }, updateData)
            .exec().catch((err) => this.handleDBError());;

        if (user) {
            return this.generateDataUserResponse(user)
        }

        return null
    }

    async UpdatePassword(username: Username, password: Password): Promise<loginUserResponse | null> {
        const user = await this.model.findOneAndUpdate({ username }, { password })
            .exec().catch((err) => this.handleDBError());;

        if (user) {
            return this.generateLoginUserResponse(user)
        }

        return null
    }

    async createPost(username: Username, postData: createPost): Promise<true | null> {

        const user = await this.model.findOne({ username }).exec().catch((err) => {
            return null;
        });
    
        if (!user) {
            return null;
        }
    
        const id = v4();
        const post = { id, ...postData };
    
        user.posts.push(post);
        await user.save();

        return true;

    }

    async addFollowerAndFollowing(followerUsername: Username, followingUsername: Username): Promise<boolean> {
        const session: ClientSession = await mongoose.startSession();
        session.startTransaction();
    
        try {
            // add follower
            const followerUser = await this.model.findOne({ username: followerUsername }).session(session);
            if (!followerUser) {
                throw new HttpError(404,`User with username ${followerUsername} not found`);
            }
            if (!followerUser.followings.includes(followingUsername)) {
                const followings = [...followerUser.followings]
                followings.push(followingUsername)
                followerUser.followings = followings;
            }else{
                throw new HttpError(404,`followed before`);
            }

            // add following
            const followingUser = await this.model.findOne({ username: followingUsername }).session(session);
            if (!followingUser) {
                throw new HttpError(404,`User with username ${followingUsername} not found`);
            }
            if (!followingUser.followers.includes(followerUsername)) {
                const followers = [...followingUser.followers];
                followers.push(followerUsername)
                followingUser.followers = followers;
            }else{
                throw new HttpError(404,`followed before`);
            }

            await followingUser.save({ session });
            await followerUser.save({ session });

            // Commit the transaction
            await session.commitTransaction();
            return true;
        } catch (error) {
            await session.abortTransaction();
            throw new HttpError(500,`transaction failed!`);
        } finally {
            session.endSession();
        }
    }

    async removeFollowerAndFollowing(followerUsername: Username, followingUsername: Username): Promise<boolean> {
        const session: ClientSession = await mongoose.startSession();
        session.startTransaction();
    
        try {
            // remove follower
            const followerUser = await this.model.findOne({ username: followerUsername }).session(session);
            if (!followerUser) {
                throw new HttpError(404,`User with username ${followerUsername} not found`);
            }
            followerUser.followings = followerUser.followings.filter(user => user !== followingUsername);

            // remove following
            const followingUser = await this.model.findOne({ username: followingUsername }).session(session);
            if (!followingUser) {
                throw new HttpError(404,`User with username ${followingUsername} not found`);
            }
            followingUser.followers = followingUser.followers.filter(user => user !== followerUsername);

            await followingUser.save({ session });
            await followerUser.save({ session });

            // Commit the transaction
            await session.commitTransaction();
            return true;
        } catch (error) {
            await session.abortTransaction();
            throw new HttpError(500,`transaction failed!`);
        } finally {
            session.endSession();
        }
    }
    

}

