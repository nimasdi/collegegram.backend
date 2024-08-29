import { Model, Document, Types } from 'mongoose';
import { IPost } from '../../db/post/post';
import { Username } from '../../types/user.types';
import { HttpError } from '../../utility/error-handler';

export interface createPost {
    images: string[],
    caption: string,
    tags: string[],
    mentions: Username[],
    closeFriendOnly: boolean
}

export interface updatePost {
    images: string[],
    caption: string,
    tags: string[],
    mentions: Username[]
}

export interface PostResponse {
    images: string[],
    caption: string,
    tags: string[],
    mentions: Username[],
    id: Types.ObjectId
}

export interface PostDataResponse {
    images: string[],
    caption: string,
    tags: string[],
    mentions: Username[],
    id: Types.ObjectId,
    likesCount: Number,
    commentsCount: Number,
    bookmarksCount: Number,
    isLikedByUser: Boolean,
    isBookmarksByUser: Boolean,
}

export class PostRepository {
    private postModel: Model<IPost & Document>;

    constructor(postModel: Model<IPost & Document>) {
        this.postModel = postModel;
    }

    private handleDBError = () => {
        throw new HttpError(500, 'خطای شبکه رخ داده است.')
    }

    private generatePostResponse: (post: IPost) => PostResponse = (post) => {
        const postResponse: PostResponse = {
            images: post.images,
            caption: post.caption,
            tags: post.tags,
            mentions: post.mentions,
            id: post.id
        };

        return postResponse;
    }

    async createPost(postData: createPost, userId: Types.ObjectId): Promise<IPost | null> {
        const post = new this.postModel({
            ...postData,
            userId
        });

        return post.save()
            .then((savedPost) => savedPost)
            .catch((err) => {
                this.handleDBError();
                return null;
            });
    }

    async updatePost(postId: string, updateData: updatePost): Promise<IPost | null> {
        return this.postModel.findByIdAndUpdate(postId, updateData, { new: true }).exec()
            .then((updatedPost) => {
                if (!updatedPost) {
                    console.warn(`Post with id ${postId} not found for update.`);
                }
                return updatedPost;
            })
            .catch((err) => {
                this.handleDBError();
                return null;
            });
    }

    async findById(postId: string): Promise<PostResponse | null> {
        const post = await this.postModel.findById(postId).exec()
            .then((post) => {
                if (!post) {
                    console.warn(`Post with id ${postId} not found.`);
                }
                return post;
            })
            .catch((err) => {
                console.error("Error finding post by ID:", err.message);
                return null;
            });
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
                    as: 'comments'
                }
            },
            {
                $lookup: {
                    from: 'likeposts',
                    localField: '_id',
                    foreignField: 'postId',
                    as: 'likes'
                }
            },
            {
                $lookup: {
                    from: 'saveposts',
                    localField: '_id',
                    foreignField: 'postId',
                    as: 'bookmarks'
                }
            },
            {
                $addFields: {
                    commentsCount: { $size: '$comments' },
                    likesCount: { $size: '$likes' },
                    bookmarksCount: { $size: '$bookmarks' },
                    isLikedByUser: {
                        $in: [userWatchPost, '$likes.username']
                    },
                    isBookmarksByUser: {
                        $in: [userWatchPost, '$bookmarks.username']
                    }
                }
            },
            {
                $project: {
                    _id: 1,
                    images: 1,
                    caption: 1,
                    tags: 1,
                    mentions: 1,
                    likesCount: 1,
                    commentsCount: 1,
                    bookmarksCount: 1,
                    isLikedByUser: 1,
                    isBookmarksByUser: 1,
                }
            }
        ]

        const posts = await this.postModel.aggregate(pipeLine).exec().catch(err => this.handleDBError());


        if (posts === null || posts.length === 0) {
            return null
        }

        const post = posts[0]
        const postResponse: PostDataResponse = {
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


    async getUserIdForPost(postId: Types.ObjectId): Promise<Types.ObjectId | null> {
        const post = await this.postModel.findById(postId).exec()
            .then((post) => {
                if (!post) {
                    console.warn(`Post with id ${postId} not found.`);
                }
                return post;
            })
            .catch((err) => {
                console.error("Error finding post by ID:", err.message);
                return null;
            });
        if (post === null) {
            return null
        }
        return post.userId;
    }

}
