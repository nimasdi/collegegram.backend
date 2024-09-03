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
    _id: CommentId,
    parentId?: CommentId,
    text: string,
    username: Username,
    likeCount: number,
    isLikedByUser : boolean
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

    async createComment(postId: PostId, createCommentData: createComment): Promise<Types.ObjectId> {

        const commentData = {
            ...createCommentData,
            postId,
            parentId: null
        };


        const comment = new this.model(commentData);
        await comment.save().catch((err) => this.handleDBError(err));

        return comment.id;
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

    async getCommentsWithLikes(postId: PostId, username: string, pageNumber: number = 1, pageSize: number = 10):
        Promise<{ comments: getCommentsWithLikes[], total: number }> {

        const skip = (pageNumber - 1) * pageSize;

        const [comments, totalComments] = await Promise.all([
            this.model.aggregate([
                { $match: { postId: new Types.ObjectId(postId) } },
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
                        likesCount: { $size: '$likes' }, // Count the number of likes
                        isLikedByUser: {
                            $in: [username, '$likes.username'] // Check if the username is in the likes array
                        }
                    }
                },
                {
                    $project: {
                        _id: 1,
                        parentId: 1,
                        text: 1,
                        username: 1,
                        likesCount: 1,
                        isLikedByUser: 1,
                        createdAt: 1
                    }
                },
                { $sort: { createdAt: -1 } }, // Sort by createdAt in descending order
                { $skip: skip },
                { $limit: pageSize }
            ]).exec(),

            this.model.countDocuments({ postId }).exec()
        ]);

        return { comments, total: totalComments };
    }
}
