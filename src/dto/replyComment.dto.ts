import {z} from 'zod'
import { isUsername, zodCommentId, zodPostId, zodUsername } from '../types/user.types';
import { checkRequired } from './createUser.dto';

interface userReplyComment{
    text: string;
    post_id: string;
    parentId: string;
}

export const replyComment = z.object({
    text: z.string().min(1),
    parentId: zodCommentId
})
.refine(data => checkRequired(data,"parentId"), {
    message: "parentId is required",
    path: ['parentId'],
  });
  
export type replyCommentDto = z.infer<typeof replyComment>;