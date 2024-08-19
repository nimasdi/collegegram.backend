import { makeApp } from "./src/app"
import MongoDBConnection from "./src/db/connection";
import { Post } from "./src/db/post/post";
import { IUser, User } from "./src/db/user/user.model";
import { CommentRepository } from "./src/repositrory/comment/comment.repository";
import { PostRepository } from "./src/repositrory/post/post.repository";
import { UserRepository } from "./src/repositrory/user/user.repositroy";
import { UserService } from "./src/services/User.service";
import { Comment } from "./src/db/comment/comment";
import dotenv from 'dotenv';
import { CommentService } from "./src/services/Comment.service";
import { LikeCommentRepository } from "./src/repositrory/comment/likeComment.repository";
import { LikeComment } from "./src/db/comment/likeComment";
import { FollowService } from "./src/services/Follow.service";
import { FollowRepository } from "./src/repositrory/Follow/follow.repository";
import { Follow } from "./src/db/Follow/follow.model";
import { PostService } from "./src/services/Post.service";

dotenv.config();

const postRepo = new PostRepository(Post)
const userRepo = new UserRepository(User);
const commentRepo = new CommentRepository(Comment)
const followRepo = new FollowRepository(Follow)
const likeCommentRepo = new LikeCommentRepository(LikeComment)
const userService = new UserService(userRepo)
const postService = new PostService(userRepo , postRepo)
const commentService = new CommentService(userRepo,postRepo, commentRepo,likeCommentRepo)
const followService = new FollowService(followRepo,userRepo)


// const uri = process.env.MONGO_URI || '';
const uri = "mongodb://localhost:27017/zoooo"


const dbConnection = new MongoDBConnection(uri);

declare global {
    namespace Express {
        interface Request {
            user: IUser;
        }
    }
};

dbConnection.connect().then(async () => {

    const app = makeApp(userService, commentService, followService , postService)

    const PORT = 3000

    app.listen(PORT, () => {
        console.log(`app run on port ${PORT}`)
    })
}).catch(err => console.log("not connected to db"))