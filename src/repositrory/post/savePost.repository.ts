import { Model, Document, Types } from 'mongoose';
import { PostId, UserId, Username } from '../../types/user.types';
import { HttpError } from '../../utility/error-handler';
import { ISavePost } from '../../db/post/bookmarkPost.model';

export interface savePost {
    username: Username,
    postId: PostId
}

export interface unSavePost {
    username: Username,
    postId: PostId
}

export class LikePostRepository {

    private model: Model<ISavePost>;

    constructor(model: Model<ISavePost>) {
        this.model = model;
    }

    private handleDBError = (error: any) => {
        console.log(error)
        throw new HttpError(500, 'خطای شبکه رخ داده است.')
    }


    async savePost(data: savePost): Promise<boolean> {

        const savedPost = new this.model(data);

        await savedPost.save().catch((err) => this.handleDBError(err));

        if (!savedPost) {
            return false;
        }
        return true;
    }

    async unSavePost(data: unSavePost): Promise<boolean> {

        const { username, postId } = data

        const result = await this.model.deleteOne({ username, postId }).exec();

        return result.deletedCount > 0;
    }

    async hasUserSavedPost(username: Username, postId: PostId): Promise<boolean> {
        const existingSavedPost = await this.model.findOne({
            username,
            postId
        }).exec().catch((err) => this.handleDBError(err));

        return !!existingSavedPost;
    }

}
