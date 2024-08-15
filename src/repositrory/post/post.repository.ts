import { Model, Document } from 'mongoose';
import { IPost } from '../../db/post/post';
import { Username } from '../../types/user.types';

export interface createPost {
    images: string[],
    caption: string,
    tags: string[],
    mentions: Username[],
}

export interface updatePost {
    images: string[],
    caption: string,
    tags: string[],
    mentions: Username[]
}

export class PostRepository {
    private postModel: Model<IPost & Document>;

    constructor(postModel: Model<IPost & Document>) {
        this.postModel = postModel;
    }

    async createPost(postData: createPost): Promise<IPost | null> {
        try {
            const post = new this.postModel(postData);
            await post.save();
            return post;
        } catch (err) {
            console.error("Error creating post:", err);
            return null;
        }
    }

    async updatePost(postId: string, updateData: updatePost): Promise<IPost | null> {
        try {
            return await this.postModel.findByIdAndUpdate(postId, updateData, { new: true }).exec();
        } catch (err) {
            console.error("Error updating post:", err);
            return null;
        }
    }

    async findById(postId: string): Promise<IPost | null> {
        try {
            return await this.postModel.findById(postId).exec();
        } catch (err) {
            console.error("Error finding post by ID:", err);
            return null;
        }
    }

}
