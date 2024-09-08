import { Model, Document, Types } from 'mongoose'
import { PostId, UserId, Username } from '../../types/user.types'
import { HttpError } from '../../utility/error-handler'
import { ISavePost } from '../../db/post/savePost.model'
import { PostDataResponse } from './post.repository'

export interface savePost {
    username: Username
    postId: PostId
}

export interface unSavePost {
    username: Username
    postId: PostId
}

export class SavePostRepository {
    private model: Model<ISavePost>

    constructor(model: Model<ISavePost>) {
        this.model = model
    }

    private handleDBError = (error: any) => {
        console.log(error)
        throw new HttpError(500, 'خطای شبکه رخ داده است.')
    }

    async savePost(data: savePost): Promise<boolean> {
        const savedPost = new this.model(data)

        await savedPost.save().catch((err) => this.handleDBError(err))

        if (!savedPost) {
            return false
        }
        return true
    }

    async unSavePost(data: unSavePost): Promise<boolean> {
        const { username, postId } = data

        const result = await this.model.deleteOne({ username, postId }).exec()

        return result.deletedCount > 0
    }

    async hasUserSavedPost(username: Username, postId: PostId): Promise<boolean> {
        const existingSavedPost = await this.model
            .findOne({
                username,
                postId,
            })
            .exec()
            .catch((err) => this.handleDBError(err))

        return !!existingSavedPost
    }

    async getSavedPosts(username: Username, userId: Types.ObjectId, pageNumber: number = 1, pageSize: number = 10): Promise<PostDataResponse[]> {
        const skip = (pageNumber - 1) * pageSize

        const posts = await this.model.aggregate([
            {
                $match: { username },
            },
            {
                $lookup: {
                    from: 'posts',
                    localField: 'postId',
                    foreignField: '_id',
                    as: 'postDetails',
                },
            },
            {
                $unwind: '$postDetails',
            },
            {
                $lookup: {
                    from: 'likeposts',
                    localField: 'postDetails._id',
                    foreignField: 'postId',
                    as: 'likes',
                },
            },
            {
                $lookup: {
                    from: 'comments',
                    localField: 'postDetails._id',
                    foreignField: 'postId',
                    as: 'comments',
                },
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'postDetails.userId',
                    foreignField: '_id',
                    as: 'creator',
                },
            },
            {
                $addFields: {
                    creatorUsername: { $arrayElemAt: ['$creator.username', 0] },
                    likesCount: { $size: '$likes' },
                    commentsCount: { $size: '$comments' },
                    isLikedByUser: {
                        $in: [username, '$likes.username'],
                    },
                },
            },
            {
                $project: {
                    id: '$postDetails._id',
                    userId: '$postDetails.userId',
                    caption: '$postDetails.caption',
                    images: '$postDetails.images',
                    tags: '$postDetails.tags',
                    mentions: '$postDetails.mentions',
                    closeFriendOnly: '$postDetails.closeFriendOnly',
                    likesCount: 1,
                    commentsCount: 1,
                    savesCount: 1,
                    isLikedByUser: 1,
                    createdAt: '$postDetails.createdAt',
                    creatorUsername: 1,
                },
            },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: pageSize },
        ])

        return posts
    }
}
