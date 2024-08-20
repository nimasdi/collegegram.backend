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

export interface getCommentResponse {
    parentId?: CommentId,
    text: string,
    username: Username,
}

export interface getCommentsWithLikes {
    parentId?: CommentId,
    text: string,
    username: Username,
    likeCount: number
}

export class CommentRepository {

    constructor(private model: Model<IComment>) {
    }

    private handleDBError = (error: any) => {
        console.log(error)
        throw new HttpError(500, 'خطای شبکه رخ داده است.')
    }

    private makeCommentResponse(comment: IComment): getCommentResponse {
        const commentResponse: getCommentResponse = {
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
        const comment = await this.model.find({ commentId }).exec();
        if (!comment) {
            return false;
        }
        return true;
    }


    // we use a cursor for the pagination and the cursor is the created at
    async getCommentsWithLikes(
        postId: PostId,
        lastCreatedAt?: Date,
        pageSize: number = 10
    ): Promise<{ comments: getCommentsWithLikes[], total: number }> {

        const matchQuery: any = { postId };

        // if we have a cursor filter documents created before that timestamp
        if (lastCreatedAt) {
            matchQuery.createdAt = { $lt: lastCreatedAt };
        }

        const [comments, totalComments] = await Promise.all([
            this.model.aggregate([
                { $match: matchQuery }, // Match comments for the specific post and cursor
                {
                    $lookup: {
                        from: 'likecomments', // Collection name for likes
                        localField: '_id',
                        foreignField: 'commentId',
                        as: 'likes'
                    }
                },
                {
                    $addFields: {
                        likesCount: { $size: '$likes' } // Count the number of likes
                    }
                },
                {
                    $project: {
                        _id: 1,
                        text: 1,
                        username: 1,
                        likesCount: 1,
                        createdAt: 1 // Include this for pagination cursor
                    }
                },
                { $sort: { createdAt: -1 } },
                { $limit: pageSize }
            ]).exec(),

            this.model.countDocuments({ postId }).exec() // Count the total number of comments
        ]);

        return { comments, total: totalComments };
    }


}
