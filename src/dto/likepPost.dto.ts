import { z } from 'zod'
import { CommentId, isUsername, PostId, UserId, Username, zodCommentId, zodPostId, zodUserId, zodUsername } from '../types/user.types';
import { checkRequired } from './createUser.dto';
import { Types } from 'mongoose';

interface likePost {
    username: Username,
    postId: PostId
}

export const likePost = z.object({
    username: zodUsername,
    postId: zodPostId,
})
    .refine(data => checkRequired(data, "username"), {
        message: "username is required",
        path: ['username'],
    })
    .refine(data => checkRequired(data, "postId"), {
        message: "postId is required",
        path: ['postId'],
    });

export type likePostDto = z.infer<typeof likePost>;

export const unlikePost = z.object({
    username: zodUsername,
    postId: zodPostId,
})
    .refine(data => checkRequired(data, "username"), {
        message: "username is required",
        path: ['username'],
    })
    .refine(data => checkRequired(data, "postId"), {
        message: "postId is required",
        path: ['postId'],
    });

export type unlikePostDto = z.infer<typeof unlikePost>;