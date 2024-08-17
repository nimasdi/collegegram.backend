import { Model, Document, Types } from 'mongoose';
import { CommentId, PostId, Username } from '../../types/user.types';
import { HttpError } from '../../utility/error-handler';
import { IComment } from '../../db/comment/comment';

export interface createComment {
    text: string,
    username: string;
}

export interface replyComment {
    text: string,
    parentId: CommentId,
    username: Username,
}


export interface createCommentResponse {
    success: boolean,
    message: string
}

export class CommentRepository {

    constructor(private model: Model<IComment>) {
    }

    private handleDBError = (error: any) => {
        console.log(error)
        throw new HttpError(500, 'خطای شبکه رخ داده است.')
    }

    async createComment(postId: PostId, createCommentData: createComment): Promise<createCommentResponse> {
        
        const commentData = {
            ...createCommentData,
            postId,
            parentId: null
        };


        const comment = new this.model(commentData);
        await comment.save().catch((err) => this.handleDBError(err));

        return {
            success:true,
            message:"comment was successfully created"
        };
    }



    async replyToComment(postId: PostId, replyCommentData: replyComment): Promise<createCommentResponse | null> {
        
        const parentComment = await this.model.findById(replyCommentData.parentId).exec();
        if (!parentComment) {
            return {
                success: false,
                message: "invalid parent comment"
            }
        }

        const commentData = {
            ...replyCommentData,
            postId
        };

        const replyComment = new this.model(commentData);
        await replyComment.save().catch((err) => this.handleDBError(err));

        return {
            success:true,
            message:"reply was successfully created"
        };
    }

}
