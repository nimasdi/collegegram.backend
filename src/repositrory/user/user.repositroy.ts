import { Model, Types } from "mongoose";
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
    posts: IPost[];
}


export class UserRepository {

    private model: Model<IUser>;

    constructor(model: Model<IUser>) {
        this.model = model;
    }


    private handleDBError = () => {
        throw new HttpError(500, 'خطای شبکه رخ داده است.')
    }

    private async populateUserPosts(user: IUser): Promise<IUser> {
        return await this.model
            .findById(user._id)
            .populate('posts')
            .exec() as IUser;
    }

    private generateDataUserResponse: (user: IUser) => dataUserResponse = (user) => {
        const populatedUser = this.populateUserPosts(user);
        const userResponse: dataUserResponse = {
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            password: user.password,
            email: user.email,
            private: user.private,
            imageUrl: user.imageUrl,
            bio: user.bio,
            posts: user.posts as unknown as IPost[],
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
        
        const user = new this.model({
            ...userData,
        });

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

    async addPostToUser(username: string, postId: Types.ObjectId): Promise<boolean> {
        try {
            const user = await this.model.findOne({ username }).exec();

            if (!user) {
                return false;
            }

            user.posts.push(postId);
            await user.save();
            return true;
        } catch (err) {
            this.handleDBError();
            return false;
        }
    }


    // async createPost(username: Username, postData: createPost): Promise<boolean> {
    //     const user = await this.model.findOne({ username }).exec().catch((err) => {
    //         this.handleDBError();
    //         return null;
    //     });

    //     if (!user) {
    //         return false;
    //     }

    //     const post = await this.postRepo.createPost({
    //         ...postData,
    //     });

    //     if (post) {
    //         user.posts.push(post._id as Types.ObjectId);
    //         await user.save().catch((err) => this.handleDBError());

    //         return true;
    //     }

    //     return false;
    // }

    // async updatePost(username: Username, postId: string, updateData: updatePost): Promise<boolean> {

    //     const user = await this.model.findOne({ username }).exec().catch((err) => {
    //         this.handleDBError();
    //         return null;
    //     });

    //     if (!user) {
    //         return false;
    //     }

    //     const updatedPost = await this.postRepo.updatePost(postId, {
    //         ...updateData,
    //     });

    //     if (updatedPost) {
    //         return true;
    //     }

    //     return false;
    // }



}

