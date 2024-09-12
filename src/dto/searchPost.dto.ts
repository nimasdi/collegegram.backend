import { z } from 'zod';
import { checkRequired } from './createUser.dto';
import { Username, zodUsername } from '../types/user.types';

interface searchPost {
    creatorUsername: Username,
    searchTags: string,
    pageNumber?: number,
    pageSize: number
}

export const searchPost = z.object({
    currentUser: zodUsername,
    searchTags: z.string().min(1),
    pageNumber: z.number().min(1).default(1), 
    pageSize: z.number().min(1).default(10) 
}).refine(data => checkRequired(data, "currentUser"), {
    message: "currentUser is required",
    path: ['currentUser'],
});

export type searchPostDto = z.infer<typeof searchPost>;
