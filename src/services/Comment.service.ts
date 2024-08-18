import { md5 } from "js-md5";
import { createUser, dataUserResponse, loginUser, loginUserResponse, updateUser, UserRepository } from "../repositrory/user/user.repositroy";
import { Email, isEmail, isPassword, isUsername, Name, Password, PostId, Username, UserWithoutPosts } from "../types/user.types";
import dotenv from 'dotenv';
import { sign } from "jsonwebtoken";
import { decodeUsernameWithSalt, encodeIdentifierWithSalt } from "../utility/decode";
import { sendEmail } from "../utility/mailer";
import path from "path";
import fs from 'fs';
import { HttpError } from "../utility/error-handler";
import { extractTags } from "../utility/extractTags";
import { createPost, PostRepository, PostResponse, updatePost } from "../repositrory/post/post.repository";
import { Types } from "mongoose";
import { createCommentDto } from "../dto/createComment.dto";
import { CommentRepository, createCommentResponse, replyCommentResponse } from "../repositrory/comment/comment.repository";
import { replyCommentDto } from "../dto/replyComment.dto";


const JWT_SECRET = process.env.JWT_SECRET as string;

if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined");
}


export class CommentService {

    constructor(private userRepo: UserRepository, private postRepo: PostRepository, private commentRepo: CommentRepository) {
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
}



