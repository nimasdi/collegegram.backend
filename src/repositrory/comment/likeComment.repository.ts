import { Model, Document, Types } from 'mongoose';
import { CommentId, PostId, UserId, Username } from '../../types/user.types';
import { HttpError } from '../../utility/error-handler';
import { IComment } from '../../db/comment/comment';
import { ILikeComment } from '../../db/comment/likeComment';

export interface likeComment {
    userId: UserId;
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

    async hasUserLikedComment(userId: UserId, commentId: CommentId): Promise<boolean> {
        const existingLike = await this.model.findOne({
            userId,
            commentId
        }).exec().catch((err) => this.handleDBError(err));

        return !!existingLike;
    }

    async likeComment(likeCommentData: likeComment): Promise<boolean> {

        // const existingLike = await this.likeCommentRepo.findByUserAndComment(userId, commentId);
        // if (existingLike) {
        //     throw new HttpError(400, "User has already liked this comment");
        // }

        const like = new this.model(likeCommentData);
        
        if (!like) {
            return false;
        }
        return true;
    }

}
