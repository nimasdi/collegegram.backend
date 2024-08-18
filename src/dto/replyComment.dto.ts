import { z } from 'zod'
import { CommentId, isUsername, PostId, UserId, zodCommentId, zodPostId, zodUserId, zodUsername } from '../types/user.types';
import { checkRequired } from './createUser.dto';
import { Types } from 'mongoose';

interface likeComment {
  userId: UserId,
  postId: PostId,
  commentId: CommentId
}

export const likeComment = z.object({
  userId: zodUserId,
  postId: zodPostId,
  commentId: zodCommentId
})
  .refine(data => checkRequired(data, "parentId"), {
    message: "parentId is required",
    path: ['parentId'],
  })
  .refine(data => checkRequired(data, "postId"), {
    message: "postId is required",
    path: ['postId'],
  });

export type likeCommentDto = z.infer<typeof likeComment>;