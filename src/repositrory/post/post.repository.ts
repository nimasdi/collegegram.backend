import { Model, Document, Types } from 'mongoose'
import { IPost } from '../../db/post/post'
import { PostId, UserId, Username } from '../../types/user.types'
import { HttpError } from '../../utility/error-handler'
import { createDeflate, inflateRaw } from 'zlib'

export interface createPost {
    images: string[]
    caption: string
    tags: string[]
    mentions: Username[]
    closeFriendOnly: boolean
}

export interface updatePost {
    images: string[]
    caption: string
    tags: string[]
    mentions: Username[]
    closeFriendOnly: boolean
}

export interface PostResponse {
    images: string[]
    caption: string
    tags: string[]
    mentions: Username[]
    id: Types.ObjectId
    createdAt: Date
    closeFriendOnly: Boolean
    userId: Types.ObjectId
}

export interface PostDataResponse {
    images: string[]
    caption: string
    tags: string[]
    mentions: Username[]
    id: Types.ObjectId
    likesCount: Number
    commentsCount: Number
    bookmarksCount: Number
    isLikedByUser: Boolean
    isBookmarksByUser: Boolean
    createdAt: Date
}

export interface ExploreDataResponse {
    postId: Types.ObjectId
    userId: Types.ObjectId
    text: string
    username: Username
    likesCount: number
    commentsCount: number
    savesCount: number
    isLikedByUser: boolean
    isSavedByUser: boolean
    createdAt: Date
}

export class PostRepository {
    private postModel: Model<IPost>

    constructor(postModel: Model<IPost>) {
        this.postModel = postModel
    }

    private handleDBError = () => {
        throw new HttpError(500, 'خطای شبکه رخ داده است.')
    }

    private generatePostResponse: (post: any) => PostResponse = (post) => {
        const postResponse: PostResponse = {
            images: post.images,
            caption: post.caption,
            tags: post.tags,
            mentions: post.mentions,
            id: post.id,
            createdAt: post.createdAt,
            closeFriendOnly: post.closeFriendOnly,
            userId: post.userId,
        }

        return postResponse
    }

    async createPost(postData: createPost, userId: Types.ObjectId): Promise<IPost | null> {
        const post = new this.postModel({
            ...postData,
            userId,
        })

        return post
            .save()
            .then((savedPost) => savedPost)
            .catch((err) => {
                this.handleDBError()
                return null
            })
    }

    async updatePost(postId: string, updateData: updatePost): Promise<IPost | null> {
        return this.postModel
            .findByIdAndUpdate(postId, updateData, { new: true })
            .exec()
            .then((updatedPost) => {
                if (!updatedPost) {
                    console.warn(`Post with id ${postId} not found for update.`)
                }
                return updatedPost
            })
            .catch((err) => {
                this.handleDBError()
                return null
            })
    }

    async findById(postId: string): Promise<PostResponse | null> {
        const post = await this.postModel
            .findById(postId)
            .exec()
            .then((post) => {
                if (!post) {
                    console.warn(`Post with id ${postId} not found.`)
                }
                return post
            })
            .catch((err) => {
                console.error('Error finding post by ID:', err.message)
                return null
            })
        if (post === null) {
            return null
        }
        return this.generatePostResponse(post)
    }

    async getPostDataById(postId: string, userWatchPost: Username): Promise<PostResponse | null> {
        const pipeLine = [
            { $match: { _id: new Types.ObjectId(postId) } },
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
                    as: 'bookmarks',
                },
            },
            {
                $addFields: {
                    commentsCount: { $size: '$comments' },
                    likesCount: { $size: '$likes' },
                    bookmarksCount: { $size: '$bookmarks' },
                    isLikedByUser: {
                        $in: [userWatchPost, '$likes.username'],
                    },
                    isBookmarksByUser: {
                        $in: [userWatchPost, '$bookmarks.username'],
                    },
                },
            },
            {
                $project: {
                    _id: 1,
                    images: 1,
                    caption: 1,
                    tags: 1,
                    mentions: 1,
                    closeFriendOnly: 1,
                    likesCount: 1,
                    commentsCount: 1,
                    bookmarksCount: 1,
                    isLikedByUser: 1,
                    isBookmarksByUser: 1,
                },
            },
        ]

        const posts = await this.postModel
            .aggregate(pipeLine)
            .exec()
            .catch((err) => this.handleDBError())

        if (posts === null || posts.length === 0) {
            return null
        }

        const post = posts[0]
        const postResponse = {
            images: post.images || [],
            caption: post.caption,
            tags: post.tags,
            mentions: post.mentions,
            id: post.id,
            likesCount: post.likesCount,
            commentsCount: post.commentsCount,
            bookmarksCount: post.bookmarksCount,
            isLikedByUser: post.isLikedByUser,
            isBookmarksByUser: post.isBookmarksByUser,
            closeFriendOnly: post.closeFriendOnly,
            createdAt: post.createdAt,
            userId: post.userId,
        }
        return postResponse
    }

    async getAll(userId: Types.ObjectId): Promise<PostResponse[] | []> {
        const userPosts = await this.postModel.find({ userId })

        const responsePosts: PostResponse[] = []
        for (const post of userPosts) {
            responsePosts.push(this.generatePostResponse(post))
        }

        return responsePosts
    }

    async getExplorePosts(username: Username, followingUserIds: Types.ObjectId[], closeFriends: Username[], blockedUsernames: Username[], pageNumber: number = 1, pageSize: number = 10): Promise<ExploreDataResponse[]> {
        const skip = (pageNumber - 1) * pageSize

        const posts = await this.postModel
            .aggregate([
                {
                    $match: {
                        userId: { $in: followingUserIds },
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
                    $addFields: {
                        isCloseFriend: {
                            $in: ['$creatorUsername', closeFriends],
                        },
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
                        creatorUsername: 1,
                        isCloseFriend: 1,
                    },
                },
                { $sort: { createdAt: -1 } },
                { $skip: skip },
                { $limit: pageSize },
            ])
            .exec()

        const filteredPosts = posts.filter((post) => {
            return (
                (!post.closeFriendOnly || (post.closeFriendOnly && post.isCloseFriend)) && // Public or close friend posts
                !blockedUsernames.includes(post.creatorUsername) // Exclude blocked users' posts
            )
        })

        return filteredPosts
    }

    async getUserIdForPost(postId: Types.ObjectId): Promise<Types.ObjectId | null> {
        const post = await this.postModel
            .findById(postId)
            .exec()
            .then((post) => {
                if (!post) {
                    console.warn(`Post with id ${postId} not found.`)
                }
                return post
            })
            .catch((err) => {
                console.error('Error finding post by ID:', err.message)
                return null
            })
        if (post === null) {
            return null
        }
        return post.userId
    }

    async getPosts(currentUsername: Username, isCloseFriend: boolean, pageNumber: number, pageSize: number): Promise<IPost[]> {
        try {
            // Fetch all posts
            const posts = await this.postModel
                .find()
                .skip((pageNumber - 1) * pageSize)
                .limit(pageSize)
                .sort({ createdAt: -1 })
                .exec()

            const filteredPosts = posts.filter((post) => {
                if (post.closeFriendOnly && !isCloseFriend) {
                    return false
                }
                return true
            })

            return filteredPosts
        } catch (error) {
            this.handleDBError()
            return []
        }
    }

    async getPostCreator(postId: PostId): Promise<Username | null> {
        const result = await this.postModel
            .aggregate([
                {
                    $match: { _id: new Types.ObjectId(postId) },
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'userId',
                        foreignField: '_id',
                        as: 'userDetails',
                    },
                },
                {
                    $unwind: {
                        path: '$userDetails',
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $project: {
                        username: '$userDetails.username',
                    },
                },
                {
                    $limit: 1,
                },
            ])
            .exec()

        if (!result || result.length === 0 || !result[0].username) {
            return null
        }

        return result[0].username
    }

    async checkCloseFriendStatus(postId: PostId): Promise<boolean | null> {
        const post = await this.postModel
            .findById(postId)
            .exec()
            .catch((err) => {
                this.handleDBError()
            })

        if (!post) {
            return null
        }
        return post.closeFriendOnly
    }

    async searchPosts(searchTags: string, currentUsername: string, followingUserIds: Types.ObjectId[], closeFriends: Username[], blockedUsernames: Username[]) {
       
        const tags = searchTags.split(' ').filter((tag) => tag.trim() !== '')

        const regexTags = tags.map((tag) => new RegExp(tag, 'i'))

        const posts = await this.postModel.aggregate([
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
                    isPrivate: { $arrayElemAt: ['$creator.private', 0] },
                },
            },
            {
                $match: {
                    creatorUsername: { $ne: currentUsername }, 
                    tags: {
                        $elemMatch: { $in: regexTags }, 
                    },
                },
            },
            {
                $lookup: {
                    from: 'follows',
                    let: { creatorUsername: '$creatorUsername', currentUsername: currentUsername },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$followingUsername', '$$creatorUsername'] },
                                        { $eq: ['$followerUsername', '$$currentUsername'] },
                                        { $eq: ['$status', 'accepted'] }, 
                                    ],
                                },
                            },
                        },
                    ],
                    as: 'followData',
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
                $addFields: {
                    isCloseFriend: {
                        $cond: {
                            if: { $in: ['$creatorUsername', closeFriends] },
                            then: true,
                            else: false,
                        },
                    },
                },
            },
            {
                $match: {
                    $and: [
                        {
                            $or: [
                                { isPrivate: false }, 
                                { $gt: [{ $size: '$followData' }, 0] }, 
                            ],
                        },
                    ],
                },
            },
            {
                $project: {
                    _id: 1,
                    userId: 1,
                    caption: 1,
                    images: 1,
                    tags: 1,
                    createdAt: 1,
                    likesCount: { $size: '$likes' }, 
                    creatorUsername: 1,
                    closeFriendOnly: 1,
                    isCloseFriend: 1,
                },
            },
            {
                $sort: { likesCount: -1 }, 
            },
        ])

        
        const filteredPosts = posts.filter((post) => {
            return (
                (!post.closeFriendOnly || (post.closeFriendOnly && post.isCloseFriend)) && // Show only close friend posts to close friends
                !blockedUsernames.includes(post.creatorUsername) // Exclude posts from blocked users
            )
        })

        return filteredPosts 
    }
}
