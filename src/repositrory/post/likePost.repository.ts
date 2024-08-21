import { Model, Document, Types } from 'mongoose';
import { IPost } from '../../db/post/post';
import { PostId, UserId, Username } from '../../types/user.types';
import { HttpError } from '../../utility/error-handler';
import { ILikePost } from '../../db/post/likePost';

export interface LikePost {
    username: Username,
    postId: PostId
}

export interface unLikePost {
    username: Username,
    postId: PostId
}
export class LikePostRepository {

    private model: Model<ILikePost>;

    constructor(model: Model<ILikePost>) {
        this.model = model;
    }

    private handleDBError = (error: any) => {
        console.log(error)
        throw new HttpError(500, 'خطای شبکه رخ داده است.')
    }


    async likePost(data: LikePost): Promise<boolean> {

        const like = new this.model(data);

        await like.save().catch((err) => this.handleDBError(err));

        if (!like) {
            return false;
        }
        return true;
    }

    async unlikePost(data: unLikePost): Promise<boolean> {

        const { username , postId } = data

        const result = await this.model.deleteOne({ username, postId }).exec();

        return result.deletedCount > 0;
    }

    async hasUserLikedPost(username: Username, postId: PostId): Promise<boolean> {
        const existingLike = await this.model.findOne({
            username,
            postId
        }).exec().catch((err) => this.handleDBError(err));

        return !!existingLike;
    }

}
