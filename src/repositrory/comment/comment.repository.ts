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

export interface replyCommentResponse {
    success: boolean,
    message: string
}

export interface getComment{
    parentId?: CommentId,
    text : string,
    username: Username
}

export class CommentRepository {

    constructor(private model: Model<IComment>) {
    }

    private handleDBError = (error: any) => {
        console.log(error)
        throw new HttpError(500, 'خطای شبکه رخ داده است.')
    }

    private makeCommentResponse(comment: IComment): getComment {
        const commentResponse: getComment = {
            parentId: comment.parentId ? (comment.parentId.toString() as CommentId) : undefined,
            text: comment.text,
            username: comment.username as Username,
        };
    
        return commentResponse;
    }
    

    async createComment(postId: PostId, createCommentData: createComment): Promise<boolean> {
        
        const commentData = {
            ...createCommentData,
            postId,
            parentId: null
        };


        const comment = new this.model(commentData);
        await comment.save().catch((err) => this.handleDBError(err));

        return true;
    }



    async replyToComment(postId: PostId, replyCommentData: replyComment): Promise<boolean> {
        
        const parentComment = await this.model.findById(replyCommentData.parentId).exec();
        if (!parentComment) {
            return false;
        }

        const commentData = {
            ...replyCommentData,
            postId
        };

        const replyComment = new this.model(commentData);
        await replyComment.save().catch((err) => this.handleDBError(err));

        return true;
    }

    async doesThisCommentExist(commentId: CommentId): Promise<boolean> {
        const comment =  await this.model.find({ commentId }).exec();
        if (!comment) {
            return false;
        }
        return true;
    }

}
