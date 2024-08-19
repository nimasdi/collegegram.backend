import { Model, Document, Types } from 'mongoose';
import { CommentId, PostId, UserId, Username } from '../../types/user.types';
import { HttpError } from '../../utility/error-handler';
import { IComment } from '../../db/comment/comment';
import { ILikeComment } from '../../db/comment/likeComment';

export interface likeComment {
    username: Username;
    postId: PostId;
    commentId: CommentId;
}


export class LikeCommentRepository {

    constructor(private model: Model<ILikeComment>) {
    }

    private handleDBError = (error: any) => {
        console.log(error)
        throw new HttpError(500, 'خطای شبکه رخ داده است.')
    }

    async hasUserLikedComment(username: Username, commentId: CommentId): Promise<boolean> {
        const existingLike = await this.model.findOne({
            username,
            commentId
        }).exec().catch((err) => this.handleDBError(err));

        return !!existingLike;
    }

    async likeComment(likeCommentData: likeComment): Promise<boolean> {

        const like = new this.model(likeCommentData);
        await like.save().catch((err) => this.handleDBError(err));
        
        if (!like) {
            return false;
        }
        return true;
    }

    async unlikeComment(username: Username, commentId: CommentId): Promise<boolean> {
        const result = await this.model.deleteOne({ username, commentId }).exec();
        return result.deletedCount > 0;
    }

    async getCommentLikes(commentId: CommentId){
        
        
    }

}
