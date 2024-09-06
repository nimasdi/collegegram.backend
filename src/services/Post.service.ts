import path from 'path'
import { createPost, PostRepository, PostResponse, updatePost } from '../repositrory/post/post.repository'
import { UserRepository } from '../repositrory/user/user.repositroy'
import { isUsername, PostId, Username } from '../types/user.types'
import { HttpError } from '../utility/error-handler'
import { extractTags } from '../utility/extractTags'
import { userCreatePostData, userUpdatePost } from './User.service'
import { convertToArray } from '../utility/convertToArray'
import fs from 'fs'
import { likePostDto, unlikePostDto } from '../dto/likepPost.dto'
import { LikePostRepository } from '../repositrory/post/likePost.repository'
import { savePostDto, unSavePostDto } from '../dto/savePost'
import { SavePostRepository } from '../repositrory/post/savePost.repository'
import { FollowRepository } from '../repositrory/Follow/follow.repository'
import { CloseFriendRepository } from '../repositrory/CloseFriend/closeFriend.repository'
import { GetPostsDto } from '../dto/getPosts.dto'
import { getExplorePostsDto } from '../dto/getUserExplorePosts.dto'
import { Types } from 'mongoose'
import { BlockRepository } from '../repositrory/Block/block.repository'
import { NotificationService } from './Notification.service'

export class PostService {
    constructor(
        private userRepo: UserRepository,
        private notifServise: NotificationService,
        private postRepo: PostRepository,
        private likePostRepo: LikePostRepository,
        private savePostRepository: SavePostRepository,
        private closeFriendRepo: CloseFriendRepository,
        private followRepo: FollowRepository,
        private blockRepo: BlockRepository
    ) {}

    private async checkMutualBlocks(userA: Username, userB: Username): Promise<boolean> {
        const userABlocksB = await this.blockRepo.checkBlock(userA, userB)
        const userBBlocksA = await this.blockRepo.checkBlock(userB, userA)
        return !!userABlocksB || !!userBBlocksA
    }

    async createPost(username: string, postData: userCreatePostData): Promise<boolean> {
        if (!isUsername(username)) {
            throw new HttpError(400, 'Invalid username')
        }

        const user = await this.userRepo.getUserByUsername(username)

        if (!user) {
            throw new HttpError(400, 'User not found')
        }

        // Check and save images
        if (!postData.images || postData.images.length === 0) {
            throw new HttpError(400, "You haven't uploaded any images")
        }

        const imageUrls = postData.images.map((image) => {
            return `http://5.34.195.108:3000/images/post/${path.basename(image)}`
        })

        const mentionsUsernames = convertToArray(postData.mentionsUsernames)

        // Validate mentions
        const mentions: Username[] = []
        if (mentionsUsernames && mentionsUsernames.length > 0) {
            for (const mentionedUsername of mentionsUsernames) {
                if (!isUsername(mentionedUsername)) {
                    throw new HttpError(400, `Invalid username: ${mentionedUsername}`)
                }

                // Check if the username exists in the database
                const mentionedUser = await this.userRepo.getUserByUsername(mentionedUsername)
                if (!mentionedUser) {
                    throw new HttpError(400, `User not found: ${mentionedUsername}`)
                }

                mentions.push(mentionedUsername)
            }
        }

        // Extract tags from caption
        const tags = extractTags(postData.caption)

        const postData2: Omit<createPost, 'createdAt'> = {
            ...postData,
            tags,
            images: imageUrls,
            mentions,
        }

        const userId = await this.userRepo.getUserIdByUsername(username)

        if (!userId) {
            throw new HttpError(500, 'User ID not found')
        }

        const createdPost = await this.postRepo.createPost(postData2, userId)

        if (createdPost) {
            return true
        }

        return false
    }

    async updatePost(username: string, postId: string, postData: userUpdatePost) {
        if (!isUsername(username)) {
            throw new HttpError(400, 'Invalid username')
        }
        console.log('jjd')

        const user = await this.userRepo.getUserByUsername(username)
        if (!user) {
            throw new HttpError(400, 'User not found')
        }

        const post = await this.postRepo.findById(postId)
        if (!post) {
            throw new HttpError(400, 'Post not found')
        }

        // Delete old images
        if (post.images && post.images.length > 0) {
            for (const oldImagePath of post.images) {
                const absolutePath = path.join(__dirname, '..', oldImagePath)
                if (fs.existsSync(absolutePath)) {
                    fs.unlinkSync(absolutePath)
                }
            }
        }

        let imageUrls: string[] = []
        if (postData.images && postData.images.length > 0) {
            imageUrls = postData.images.map((image) => {
                return `http://5.34.195.108:3000/images/post/${path.basename(image)}`
            })
        } else {
            throw new HttpError(400, "You can't have a post without any images")
        }

        const mentionsUsernames = convertToArray(postData.mentionsUsernames)

        // Validate and process mentions
        const mentions: Username[] = []
        if (mentionsUsernames && mentionsUsernames.length > 0) {
            for (const mentionedUsername of mentionsUsernames) {
                if (!isUsername(mentionedUsername)) {
                    throw new HttpError(400, `Invalid username: ${mentionedUsername}`)
                }

                const mentionedUser = await this.userRepo.getUserByUsername(mentionedUsername)
                if (!mentionedUser) {
                    throw new HttpError(400, `User not found: ${mentionedUsername}`)
                }

                mentions.push(mentionedUsername)
            }
        }

        // Extract tags from caption
        const tags = extractTags(postData.caption)

        const updateData: updatePost = {
            images: imageUrls,
            caption: postData.caption,
            tags,
            mentions,
            closeFriendOnly: postData.closeFriendOnly,
        }

        const result = await this.postRepo.updatePost(postId, updateData)
        if (!result) {
            throw new HttpError(400, 'Failed to update the post')
        }

        return true
    }

    async getPostById(postId: PostId, userWatchPost: Username): Promise<PostResponse> {
        const post = await this.postRepo.getPostDataById(postId, userWatchPost)
        if (!post) {
            throw new HttpError(404, 'post not found.')
        }

        // block
        const postCreator = (await this.postRepo.getPostCreator(postId)) as Username
        const senderIsBlocked = await this.blockRepo.checkBlock(postCreator, userWatchPost)
        if (senderIsBlocked) {
            throw new HttpError(403, `${postCreator} is blocked by ${userWatchPost}`)
        }
        const isReceiverBlocked = await this.blockRepo.checkBlock(userWatchPost, postCreator)
        if (isReceiverBlocked) {
            throw new HttpError(403, `${userWatchPost} is blocked by ${postCreator}`)
        }

        // close
        const postIsCloseFriend = await this.postRepo.checkCloseFriendStatus(postId)
        if (postIsCloseFriend) {
            if (postCreator != userWatchPost) {
                const isCloseFriend = await this.closeFriendRepo.checkCloseFriend(userWatchPost, postCreator)
                if (!isCloseFriend && postCreator !== userWatchPost) {
                    throw new HttpError(403, 'You are not authorized to view this post.')
                }
            }
        }

        // private
        const isPrivate = await this.userRepo.checkAccountPrivacy(postCreator)
        const isFollowing = await this.followRepo.checkFollow(userWatchPost, postCreator)

        if (isPrivate && !isFollowing) {
            throw new HttpError(403, `you dont follow the user.`)
        }

        return post
    }

    async savePost(savePostData: savePostDto): Promise<boolean> {
        const post = await this.postRepo.findById(savePostData.postId)
        if (!post) {
            throw new HttpError(400, 'this comment does not exist')
        }

        const user = await this.userRepo.getUserByUsername(savePostData.username)
        if (!user) {
            throw new HttpError(400, 'user does not exist')
        }

        const userHasSaved = await this.savePostRepository.hasUserSavedPost(savePostData.username, savePostData.postId)
        if (userHasSaved) {
            throw new HttpError(400, 'User has already liked this comment')
        }

        await this.savePostRepository.savePost(savePostData)

        return true
    }

    async unSavePost(unSavePostData: unSavePostDto): Promise<boolean> {
        const post = await this.postRepo.findById(unSavePostData.postId)
        if (!post) {
            throw new HttpError(400, 'this comment does not exist')
        }

        const user = await this.userRepo.getUserByUsername(unSavePostData.username)
        if (!user) {
            throw new HttpError(400, 'user does not exist')
        }

        const userHasLiked = await this.savePostRepository.hasUserSavedPost(unSavePostData.username, unSavePostData.postId)
        if (!userHasLiked) {
            throw new HttpError(400, 'User has not liked this post')
        }

        await this.savePostRepository.unSavePost(unSavePostData)

        return true
    }

    async likePost(likePostData: likePostDto): Promise<boolean> {
        const post = await this.postRepo.findById(likePostData.postId)
        if (!post) {
            throw new HttpError(400, 'this comment does not exist')
        }

        const user = await this.userRepo.getUserByUsername(likePostData.username)
        if (!user) {
            throw new HttpError(400, 'user does not exist')
        }

        const userHasLiked = await this.likePostRepo.hasUserLikedPost(likePostData.username, likePostData.postId)
        if (userHasLiked) {
            throw new HttpError(400, 'User has already liked this comment')
        }

        await this.likePostRepo.likePost(likePostData)

        this.notifServise.createNotification(likePostData.username, 'likePost', post.id, post.userId.toString())
        this.notifServise.createNotificationForFollowers(likePostData.username, 'likePost', post.id, post.userId.toString(), post.closeFriendOnly)

        return true
    }

    async unlikePost(unlikePostData: unlikePostDto): Promise<boolean> {
        const post = await this.postRepo.findById(unlikePostData.postId)
        if (!post) {
            throw new HttpError(400, 'this comment does not exist')
        }

        const user = await this.userRepo.getUserByUsername(unlikePostData.username)
        if (!user) {
            throw new HttpError(400, 'user does not exist')
        }

        const userHasLiked = await this.likePostRepo.hasUserLikedPost(unlikePostData.username, unlikePostData.postId)
        if (!userHasLiked) {
            throw new HttpError(400, 'User has not saved this post')
        }

        await this.likePostRepo.unlikePost(unlikePostData)

        return true
    }

    async getUserExplorePosts(data: getExplorePostsDto) {
        const { username, pageNumber, pageSize } = data

        const followersUsernames = await this.followRepo.getUserFollowingNames(username)

        const ids = (await Promise.all(
            followersUsernames.map(async (username) => {
                return await this.userRepo.getUserIdByUsername(username)
            })
        )) as Types.ObjectId[]

        const blockedUsers = await this.blockRepo.getUserBlockedUsernames(username)

        const closeFriendNames = await this.closeFriendRepo.getCloseFriends2(username)

        const postsForUser = await this.postRepo.getExplorePosts(username, ids, closeFriendNames, blockedUsers, pageNumber, pageSize)

        return postsForUser || []
    }

    async getUserPosts(username: Username): Promise<PostResponse[]> {
        const userId = await this.userRepo.getUserIdByUsername(username)
        if (!userId) throw new HttpError(404, 'user not found.')

        const posts = await this.postRepo.getAll(userId)
        if (posts.length === 0) return []

        return posts
    }

    async getUserPostsWithPagination(data: GetPostsDto) {
        const creatorExist = await this.userRepo.checkUserExist(data.creatorUsername)
        if (!creatorExist) {
            throw new HttpError(404, 'user not found.')
        }

        const watcherExist = await this.userRepo.checkUserExist(data.watcherUsername)
        if (!watcherExist) {
            throw new HttpError(404, 'user not found.')
        }

        // block
        const senderIsBlocked = await this.blockRepo.checkBlock(data.creatorUsername, data.watcherUsername)
        if (senderIsBlocked) {
            return []
        }
        const isReceiverBlocked = await this.blockRepo.checkBlock(data.watcherUsername, data.creatorUsername)
        if (isReceiverBlocked) {
            return []
        }

        // close
        const isCloseFriend = data.creatorUsername !== data.watcherUsername && (await this.closeFriendRepo.checkCloseFriend(data.watcherUsername, data.creatorUsername))

        // private
        const isPrivate = await this.userRepo.checkAccountPrivacy(data.creatorUsername)

        if (isPrivate) {
            const follows = await this.followRepo.checkFollow(data.watcherUsername, data.creatorUsername)
            if (!follows) {
                throw new HttpError(403, `Cannot view posts. ${data.creatorUsername} is private, and you do not follow them.`)
            }
        }

        const posts = await this.postRepo.getPosts(data.creatorUsername, !!isCloseFriend, data.pageNumber, data.pageSize)

        return posts
    }

    async getUserOwnPosts(username: Username): Promise<PostResponse[]> {
        const userId = await this.userRepo.getUserIdByUsername(username)
        if (!userId) throw new HttpError(404, 'user not found.')

        const posts = await this.postRepo.getAll(userId)
        if (posts.length === 0) return []

        return posts
    }
}
