import { z } from 'zod';
import { Username, zodUsername } from '../types/user.types';
import { checkRequired } from './createUser.dto';

interface getExplorePosts {
    username: Username
    pageNumber?: number,
    pageSize: number
}

export const getExplorePosts = z.object({
    username: zodUsername,
    pageNumber: z.number().min(1).default(1), 
    pageSize: z.number().min(1).default(10) 
}).refine(data => checkRequired(data, "username"), {
    message: "username is required",
    path: ['username'],
});

export type getExplorePostsDto = z.infer<typeof getExplorePosts>;
