import { Response, Request, NextFunction } from "express"
import { HttpError } from "./error-handler";
import { Types } from "mongoose";
import { PostRepository } from "../repositrory/post/post.repository";
import { UserRepository } from "../repositrory/user/user.repositroy";


/// middleware to check for updating post 
export const checkUserMiddleware = (postRepo: PostRepository, userRepo: UserRepository) => {

    return async (req: Request, res: Response, next: NextFunction) => {

        try {

            const currentUser = req.user.username;
            const postId = req.params.postid;

            if (!currentUser) {
                throw new HttpError(401, "User is not authenticated");
            }

            const userId = await userRepo.getUserIdByUsername(currentUser)

            if (!postId) {
                throw new HttpError(400, "Post ID is required");
            }

            const postUserId = await postRepo.getUserIdForPost(new Types.ObjectId(postId));
            if (!postUserId) {
                throw new HttpError(404, "Post not found");
            }


            if (postUserId.toString() != userId?.toString()) {
                throw new HttpError(403, "User is not authorized to update this post");
            }

            next();
        } catch (error) {
            console.log(error)
            next(error);
        }

    }

}
