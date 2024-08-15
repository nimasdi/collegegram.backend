import { Model, Document, Types } from 'mongoose';
import { IPost } from '../../db/post/post';
import { Username } from '../../types/user.types';
import { HttpError } from '../../utility/error-handler';

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

export interface PostResponse{
    images: string[],
    caption: string,
    tags: string[],
    mentions: Username[],
    id: Types.ObjectId
}

export class PostRepository {
    private postModel: Model<IPost & Document>;

    constructor(postModel: Model<IPost & Document>) {
        this.postModel = postModel;
    }

    private handleDBError = () => {
        throw new HttpError(500, 'خطای شبکه رخ داده است.')
    }

    private generatePostResponse : (post: IPost) => PostResponse = (post) => {
        const postResponse: PostResponse = {
            images: post.images,
            caption: post.caption,
            tags: post.tags,
            mentions: post.mentions,
            id: post.id
        };

        return postResponse;
    }

    async createPost(postData: createPost, userId: Types.ObjectId): Promise<IPost | null> {
        const post = new this.postModel({
            ...postData,
            userId
        });

        return post.save()
            .then((savedPost) => savedPost)
            .catch((err) => {
                this.handleDBError();
                return null;
            });
    }

    async updatePost(postId: string, updateData: updatePost): Promise<IPost | null> {
        return this.postModel.findByIdAndUpdate(postId, updateData, { new: true }).exec()
            .then((updatedPost) => {
                if (!updatedPost) {
                    console.warn(`Post with id ${postId} not found for update.`);
                }
                return updatedPost;
            })
            .catch((err) => {
                this.handleDBError();
                return null;
            });
    }

    async findById(postId: string): Promise<IPost | null> {
        return this.postModel.findById(postId).exec()
            .then((post) => {
                if (!post) {
                    console.warn(`Post with id ${postId} not found.`);
                }
                return post;
            })
            .catch((err) => {
                console.error("Error finding post by ID:", err.message);
                return null;
            });
    }

    async getAll(userId: Types.ObjectId) : Promise< PostResponse[] | []>{
        const userPosts = await this.postModel.find({userId})

        const responsePosts : PostResponse[] = []
        for(const post of userPosts){
            responsePosts.push(this.generatePostResponse(post))
        }

        return responsePosts
    }

}
