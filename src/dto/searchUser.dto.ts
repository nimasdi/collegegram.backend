import { z } from 'zod';
import { PostId, Username, zodCommentId, zodPostId, zodUsername } from '../types/user.types';
import { checkRequired } from './createUser.dto';

interface searchUser {
    creatorUsername: Username,
    searchText: Username,
    pageNumber?: number,
    pageSize: number
}

export const searchUser = z.object({
    currentUser: zodUsername,
    searchText: z.string().min(1),
    pageNumber: z.number().min(1).default(1), 
    pageSize: z.number().min(1).default(10) 
}).refine(data => checkRequired(data, "currentUser"), {
    message: "currentUser is required",
    path: ['currentUser'],
});

export type searchUserDto = z.infer<typeof searchUser>;
