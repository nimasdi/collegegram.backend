import { z } from 'zod';
import { PostId, zodCommentId, zodPostId, zodUsername } from '../types/user.types';
import { checkRequired } from './createUser.dto';

interface GetComment {
    postId: PostId,
    pageNumber?: number,
    pageSize: number
}

export const GetComment = z.object({
    postId: zodPostId,
    username: zodUsername,
    pageNumber: z.number().min(1).default(1), 
    pageSize: z.number().min(1).default(10) 
}).refine(data => checkRequired(data, "postId"), {
    message: "postId is required",
    path: ['postId'],
});

export type GetCommentDto = z.infer<typeof GetComment>;
