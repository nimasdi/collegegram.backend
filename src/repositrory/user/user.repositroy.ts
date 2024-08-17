import mongoose, {  ClientSession, Model, Types } from "mongoose";
import { IUser } from "../../db/user/user.model";
import { Email, Name, Password, Username } from "../../types/user.types";
import { HttpError } from "../../utility/error-handler";
import { IPost, postSchema } from "../../db/post/post";

export interface createUser {
    username: Username;
    password: Password;
    email: Email;
}

export interface updateUser {
    firstName: Name;
    lastName: Name;
    password: Password;
    email: Email;
    private: boolean;
    imageUrl?: string;
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


export class UserRepository {

    private model: Model<IUser>;

    constructor(model: Model<IUser>) {
        this.model = model;
    }

    private handleDBError = (error : any) => {
        console.log(error)
        throw new HttpError(500,'خطای شبکه رخ داده است.')
    }

    // private async populateUserPosts(user: IUser): Promise<IUser> {
    //     return await this.model
    //         .findById(user._id)
    //         .populate('posts')
    //         .exec() as IUser;
    // }

    private generateDataUserResponse: (user: IUser) => dataUserResponse = (user) => {

        const userResponse: dataUserResponse = {
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            password: user.password,
            email: user.email,
            private: user.private,
            imageUrl: user.imageUrl,
            bio: user.bio,
        };
        // console.log(userResponse)
        return userResponse;
    };


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
        await user.save().catch((err) => this.handleDBError(err));

        return true
    }

    async getUserByUsername(username: Username): Promise<dataUserResponse | null> {
        const user = await this.model.findOne({ username }, { _id: 0, password: 0 })
            .exec().catch((err) => this.handleDBError(err));

        if (user) {
            return this.generateDataUserResponse(user)
        }

        return null
    }

    async getUserPasswordByUsername(username: Username): Promise<loginUserResponse | null> {
        const user = await this.model.findOne({ username }, { _id: 0, password: 1, username: 1, email: 1 })
            .exec().catch((err) => this.handleDBError(err));

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
            .exec().catch((err) => this.handleDBError(err));

        if (user) {
            return true
        }

        return false
    }

    async getUserPasswordByEmail(email: Email): Promise<loginUserResponse | null> {
        const user = await this.model.findOne({ email }, { _id: 0, password: 1, username: 1, email: 1 })
            .exec().catch((err) => this.handleDBError(err));;

        if (user) {
            return this.generateLoginUserResponse(user)
        }

        return null
    }

    async updateUser(username: string, updateData: updateUser): Promise<dataUserResponse | null> {
        const user = await this.model.findOneAndUpdate({ username }, updateData)
            .exec().catch((err) => this.handleDBError(err));

        console.log(user)

        if (user) {
            return this.generateDataUserResponse(user)
        }

        console.log(user)

        return null
    }

    async UpdatePassword(username: Username, password: Password): Promise<loginUserResponse | null> {
        const user = await this.model.findOneAndUpdate({ username }, { password })
            .exec().catch((err) => this.handleDBError(err));;

        if (user) {
            return this.generateLoginUserResponse(user)
        }

        return null
    }


    async addFollowerAndFollowing(followerUsername: Username, followingUsername: Username): Promise<void> {

        // get follower and following
        const followerUser = await this.model.findOne({ username: followerUsername })
        if (!followerUser) {
            throw new HttpError(404,`User with username ${followerUsername} not found`);
        }
        const followingUser = await this.model.findOne({ username: followingUsername })
        if (!followingUser) {
            throw new HttpError(404,`User with username ${followingUsername} not found`);
        }

        // add follower
         if (!followingUser.followers.includes(followerUser.username)) {
            const followers = [...followingUser.followers];
            followers.push(followerUser.username)
            followingUser.followers = followers;
        }else{
            throw new HttpError(404,`followed before`);
        }


        //add following
        if (!followerUser.followings.includes(followingUser.username)) {
            const followings = [...followerUser.followings]
            followings.push(followingUser.username)
            followerUser.followings = followings;
        }else{
            throw new HttpError(404,`followed before`);
        }

        await followingUser.save();
        await followerUser.save();
        
    }

    async removeFollowerAndFollowing(followerUsername: Username, followingUsername: Username): Promise<void> {

        // get follower and following
        const followerUser = await this.model.findOne({ username: followerUsername })
        if (!followerUser) {
            throw new HttpError(404,`User with username ${followerUsername} not found`);
        }
        const followingUser = await this.model.findOne({ username: followingUsername })
        if (!followingUser) {
            throw new HttpError(404,`User with username ${followingUsername} not found`);
        }

        //remove follower
        followerUser.followings = followerUser.followings.filter(user => user !== followingUser.username);

        //remove following
        followingUser.followers = followingUser.followers.filter(user => user !== followerUser.username);


        await followingUser.save();
        await followerUser.save();
        
    }
 

    async getUserIdByUsername(username: Username): Promise<Types.ObjectId | null> {
        const user = await this.model.findOne({ username }, { _id: 1 })
            .exec().catch((err) => this.handleDBError(err));

        if (user) {
            return user._id as Types.ObjectId;
        }

        return null;
    }

}

