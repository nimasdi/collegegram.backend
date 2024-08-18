import {z} from 'zod'
import { isUsername, zodPostId, zodUsername } from '../types/user.types';
import { checkRequired } from './createUser.dto';

interface userCreateComment{
    text: string;
    post_id: string;
}

export const createComment = z.object({
    text: z.string().min(1),
    post_id: zodPostId
})
.refine(data => checkRequired(data,"post_id"), {
    message: "post_id is required",
    path: ['post_id'],
  });

export type createCommentDto = z.infer<typeof createComment>;