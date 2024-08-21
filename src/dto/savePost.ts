import { z } from 'zod'
import { PostId, Username, zodPostId, zodUsername } from '../types/user.types';
import { checkRequired } from './createUser.dto';

interface savePost {
    username: Username,
    postId: PostId
}

export const savePost = z.object({
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

export type likePostDto = z.infer<typeof savePost>;

export const unSavePost = z.object({
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

export type unSavePostDto = z.infer<typeof unSavePost>;
