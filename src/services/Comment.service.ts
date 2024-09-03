import { CommentId, isPostId, PostId, Username } from '../types/user.types'
import { HttpError } from '../utility/error-handler'
import { PostRepository } from '../repositrory/post/post.repository'
import { createCommentDto } from '../dto/createComment.dto'
import { CommentRepository, createCommentResponse, getCommentsWithLikes, replyCommentResponse } from '../repositrory/comment/comment.repository'
import { LikeCommentRepository } from '../repositrory/comment/likeComment.repository'
import { UserRepository } from '../repositrory/user/user.repositroy'
import { replyCommentDto } from '../dto/replyComment.dto'
import { likeCommentDto } from '../dto/likeComment.dto'
import { GetCommentDto } from '../dto/getCommentWithLikes'
import { BlockRepository } from '../repositrory/Block/block.repository'
import { CloseFriendRepository } from '../repositrory/CloseFriend/closeFriend.repository'
import { FollowRepository } from '../repositrory/Follow/follow.repository'

const JWT_SECRET = process.env.JWT_SECRET as string

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined')
}

export interface NestedComment extends getCommentsWithLikes {
    children?: NestedComment[]
}

export class CommentService {
    constructor(private userRepo: UserRepository, private postRepo: PostRepository, private commentRepo: CommentRepository, private likeCommentRepository: LikeCommentRepository,private closeFriendRepo : CloseFriendRepository , private followRepo : FollowRepository ,private blockRepo: BlockRepository) {}

    async createComment(username: Username, createComment: createCommentDto): Promise<createCommentResponse> {
        const { post_id, text } = createComment

        const postExists = await this.postRepo.findById(createComment.post_id)
        if (!postExists) {
            throw new HttpError(400, 'Post not found')
        }

        const commentData = {
            text,
            username,
        }

        const res = await this.commentRepo.createComment(post_id, commentData)

        return {
            success: true,
            message: 'comment was successfully created',
        }
    }

    async replyToComment(username: Username, post_id: PostId, replyCommentData: replyCommentDto): Promise<replyCommentResponse> {
        const post = await this.postRepo.findById(post_id)
        if (!post) {
            return {
                success: false,
                message: 'Post not found',
            }
        }

        const commentData = {
            ...replyCommentData,
            username,
        }

        await this.commentRepo.replyToComment(post_id, commentData)

        return {
            success: true,
            message: 'Reply comment was successfully created',
        }
    }

    async likeAComment(likeCommentDto: likeCommentDto): Promise<boolean> {
        const comment = await this.commentRepo.doesThisCommentExist(likeCommentDto.commentId)
        if (!comment) {
            throw new HttpError(400, 'this comment does not exist')
        }

        const user = await this.userRepo.checkUserExist(likeCommentDto.username)
        if (!user) {
            throw new HttpError(400, 'user does not exist')
        }

        const userHasLiked = await this.likeCommentRepository.hasUserLikedComment(likeCommentDto.username, likeCommentDto.commentId)
        if (userHasLiked) {
            throw new HttpError(400, 'User has already liked this comment')
        }

        await this.likeCommentRepository.likeComment(likeCommentDto)

        return true
    }

    async unlikeAComment(likeCommentDto: likeCommentDto): Promise<boolean> {
        const commentExists = await this.commentRepo.doesThisCommentExist(likeCommentDto.commentId)
        if (!commentExists) {
            throw new HttpError(400, 'This comment does not exist')
        }

        const userExists = await this.userRepo.checkUserExist(likeCommentDto.username)
        if (!userExists) {
            throw new HttpError(400, 'User does not exist')
        }

        const userHasLiked = await this.likeCommentRepository.hasUserLikedComment(likeCommentDto.username, likeCommentDto.commentId)
        if (!userHasLiked) {
            throw new HttpError(400, 'User has not liked this comment')
        }

        await this.likeCommentRepository.unlikeComment(likeCommentDto.username, likeCommentDto.commentId)

        return true
    }

    async getUserLikedComments(username: Username, postId: string): Promise<CommentId[]> {
        if (!isPostId(postId)) {
            throw new HttpError(400, 'post id is not valid')
        }

        const comments = await this.likeCommentRepository.getUserLikedCommentIdsOnPost(username, postId)

        return comments
    }

    async getCommentsWithLikes(commentData: GetCommentDto) {
        const { postId, username, pageNumber, pageSize } = commentData

        const postCreator = await this.postRepo.getPostCreator(postId)
        if (!postCreator) {
            throw new HttpError(404, `Post with ID ${postId} not found.`)
        }

        // block
        const senderIsBlocked = await this.blockRepo.checkBlock(postCreator, username)
        if (senderIsBlocked) {
            throw new HttpError(403, `You are not allowed to view comments on this post.`)
        }
        const receiverIsBlocked = await this.blockRepo.checkBlock(username , postCreator)
        if (receiverIsBlocked) {
            throw new HttpError(403, `You are not allowed to view comments on this post.`)
        }


        // close
        const isCloseFriend = postCreator !== username && (await this.closeFriendRepo.checkCloseFriend(username, postCreator))
        const postIsCloseFriend = await this.postRepo.checkCloseFriendStatus(postId)
        if (!isCloseFriend && postIsCloseFriend) {
            throw new HttpError(403, `Post doesnt exist.`)
        }

        // private
        const isPrivate = await this.userRepo.checkAccountPrivacy(postCreator)
        const isFollowing = await this.followRepo.checkFollow(username, postCreator)
        if (isPrivate && !isFollowing) {
            throw new HttpError(403, `you dont follow the user.`)
        }
        
        const { comments, total } = await this.commentRepo.getCommentsWithLikes(postId, username, pageNumber, pageSize)

        const nestedComments = this.buildNestedComments(comments)

        return { nestedComments, total }
    }

    private buildNestedComments(comments: getCommentsWithLikes[]): NestedComment[] {
        const commentMap: { [key: string]: NestedComment } = {}

        comments.forEach((comment) => {
            commentMap[comment._id] = { ...comment, children: [] }
        })

        const nestedComments: NestedComment[] = []

        comments.forEach((comment) => {
            if (comment.parentId) {
                // If the comment has a parentId, add it to the parent's children array
                const parent = commentMap[comment.parentId]
                if (parent) {
                    parent.children!.push(commentMap[comment._id])
                }
            } else {
                // If the comment doesn't have a parentId, it's a top-level comment
                nestedComments.push(commentMap[comment._id])
            }
        })

        return nestedComments
    }
}
