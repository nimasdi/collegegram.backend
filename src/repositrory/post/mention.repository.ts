import { Model, Document, Types } from 'mongoose';
import { IPost } from '../../db/post/post';
import { PostId, UserId, Username } from '../../types/user.types';
import { HttpError } from '../../utility/error-handler';

export interface postsDataResponse {
    postId: Types.ObjectId
    userId: Types.ObjectId
    images: string[]
    caption: string
    tags: string[]
    mentions: Username[]
    username: Username
    likesCount: number
    commentsCount: number
    savesCount: number
    isLikedByUser: boolean
    isSavedByUser: boolean
    createdAt: Date
}

export class MentionRepository {

    private model: Model<IPost>;

    constructor(model: Model<IPost>) {
        this.model = model;
    }

    private handleDBError = (error: any) => {
        console.log(error)
        throw new HttpError(500, 'خطای شبکه رخ داده است.')
    }

    private generatePostResponse: (post: any) => postsDataResponse = (post) => {
        const postResponse: postsDataResponse = {
            images: post.images,
            caption: post.caption,
            tags: post.tags,
            mentions: post.mentions,
            postId: post.id,
            userId: post.userId,
            username: post.creatorUsername,
            likesCount: post.likesCount,
            commentsCount: post.commentsCount,
            savesCount: post.savesCount,
            isLikedByUser: post.isLikedByUser,
            isSavedByUser: post.isSavedByUser,
            createdAt: post.createdAt
        };

        return postResponse
    }


    async getMentionPostsListByUsername(username: Username): Promise<postsDataResponse[]> {

        const posts = await this.model
        .aggregate([
            {
                $match: {
                    mentions: { $in: [username] }
                },
            },
            {
                $lookup: {
                    from: 'likeposts',
                    localField: '_id',
                    foreignField: 'postId',
                    as: 'likes',
                },
            },
            {
                $lookup: {
                    from: 'saveposts',
                    localField: '_id',
                    foreignField: 'postId',
                    as: 'saves',
                },
            },
            {
                $lookup: {
                    from: 'comments',
                    localField: '_id',
                    foreignField: 'postId',
                    as: 'comments',
                },
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'creator',
                },
            },
            {
                $addFields: {
                    creatorUsername: { $arrayElemAt: ['$creator.username', 0] }, 
                },
            },
            {
                $project: {
                    _id: 1,
                    userId: 1,
                    caption: 1,
                    images: 1,
                    tags: 1,
                    mentions: 1,
                    closeFriendOnly: 1,
                    likesCount: { $size: '$likes' },
                    commentsCount: { $size: '$comments' },
                    savesCount: { $size: '$saves' },
                    isLikedByUser: {
                        $in: [username, '$likes.username'],
                    },
                    isSavedByUser: {
                        $in: [username, '$saves.username'],
                    },
                    createdAt: 1,
                    creatorUsername: 1
                },
            },
            { $sort: { createdAt: -1 } },
        ])
        .exec()

        const responsePosts: postsDataResponse[] = []
        for (const post of posts) {
            responsePosts.push(this.generatePostResponse(post))
        }

        return responsePosts
    }
}
