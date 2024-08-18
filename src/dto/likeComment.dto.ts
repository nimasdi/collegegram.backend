import { z } from 'zod'
import { CommentId, isUsername, PostId, UserId, Username, zodCommentId, zodPostId, zodUserId, zodUsername } from '../types/user.types';
import { checkRequired } from './createUser.dto';
import { Types } from 'mongoose';

interface likeComment {
  username: Username,
  postId: PostId,
  commentId: CommentId
}

export const likeComment = z.object({
  username: zodUsername,
  postId: zodPostId,
  commentId: zodCommentId
})
  .refine(data => checkRequired(data, "commentId"), {
    message: "commentId is required",
    path: ['commentId'],
  })
  .refine(data => checkRequired(data, "postId"), {
    message: "postId is required",
    path: ['postId'],
  });

export type likeCommentDto = z.infer<typeof likeComment>;