import { z } from 'zod';
import { PostId, Username, zodCommentId, zodPostId, zodUsername } from '../types/user.types';
import { checkRequired } from './createUser.dto';

interface getPosts {
    creatorUsername: Username,
    watcherUsername: Username,
    pageNumber?: number,
    pageSize: number
}

export const GetPosts = z.object({
    creatorUsername: zodUsername,
    watcherUsername: zodUsername,
    pageNumber: z.number().min(1).default(1), 
    pageSize: z.number().min(1).default(10) 
}).refine(data => checkRequired(data, "creatorUsername"), {
    message: "creatorUsername is required",
    path: ['creatorUsername'],
}).refine(data => checkRequired(data, "watcherUsername"), {
    message: "watcherUsername is required",
    path: ['watcherUsername'],
});

export type GetPostsDto = z.infer<typeof GetPosts>;
