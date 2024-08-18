import { PostId, Username } from "../types/user.types";
import { HttpError } from "../utility/error-handler";
import { PostRepository } from "../repositrory/post/post.repository";
import { createCommentDto } from "../dto/createComment.dto";
import { CommentRepository, createCommentResponse, replyCommentResponse } from "../repositrory/comment/comment.repository";
import { likeCommentDto} from "../dto/replyComment.dto";
import { LikeCommentRepository } from "../repositrory/comment/likeComment.repository";
import { replyCommentDto } from "../dto/likeComment.dto";
import { UserRepository } from "../repositrory/user/user.repositroy";


const JWT_SECRET = process.env.JWT_SECRET as string;

if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined");
}


export class CommentService {

    constructor(private userRepo: UserRepository,private postRepo: PostRepository, private commentRepo: CommentRepository , private likeCommentRepository: LikeCommentRepository) {
    }


    async createComment(username: Username, createComment: createCommentDto): Promise<createCommentResponse> {

        const { post_id, text } = createComment;

        const postExists = await this.postRepo.findById(createComment.post_id)
        if (!postExists) {
            throw new HttpError(400, 'Post not found');
        }

        const commentData = {
            text,
            username,
        }

        const res = await this.commentRepo.createComment(post_id, commentData)

        return {
            success: true,
            message: "comment was successfully created"
        };

    }

    async replyToComment(username: Username, post_id: PostId, replyCommentData: replyCommentDto): Promise<replyCommentResponse> {

        const post = await this.postRepo.findById(post_id);
        if (!post) {
            return {
                success: false,
                message: "Post not found"
            };
        }

        const commentData = {
            ...replyCommentData,
            username,
        };

        await this.commentRepo.replyToComment(post_id, commentData);

        return {
            success: true,
            message: "Reply comment was successfully created"
        };
    }

    async likeAComment(likeCommentDto : likeCommentDto) {

        const comment = await this.commentRepo.doesThisCommentExist(likeCommentDto.commentId);
        if (!comment) {
            throw new HttpError(400, "this comment does not exist");
        }

        const user = await this.userRepo.doesThisUserExist(likeCommentDto.userId);
        if (!user) {
            throw new HttpError(400 , "user does not exist")
        }

        const userHasLiked = await this.likeCommentRepository.hasUserLikedComment(likeCommentDto.userId, likeCommentDto.commentId);
        if (userHasLiked) {
            throw new HttpError(400, "User has already liked this comment");
        }

        await this.likeCommentRepository.likeComment(likeCommentDto);

        return true;
    }
}



