import {z} from 'zod'
import { PostId, zodCommentId, zodPostId } from '../types/user.types';
import { checkRequired } from './createUser.dto';


interface GetComment{
    postId: PostId,
    lastCreatedAt?: Date,
    pageSize: number
}

export const GetComment = z.object({
    postId: zodPostId,
    lastCreatedAt: z.date().optional(),
    pageSize : z.number().default(10)
})
  .refine(data => checkRequired(data,"postId"), {
    message: "postId is required",
    path: ['postId'],
  });
  
export type GetCommentDto = z.infer<typeof GetComment>;