import express from "express"
import { UserService } from "./services/User.service";
import { UserRoute } from "./routes/user.route";
import swaggerJsDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import swaggerOptions from '../swaggerOptions';
import path from "path";
import cors from "cors"
import { CommentService } from "./services/Comment.service";
import { CommentRoute } from "./routes/comment.route";
import { FollowRoute } from "./routes/follow.route";
import { FollowService } from "./services/Follow.service";
import { PostService } from "./services/Post.service";
import { MakePostRoute } from "./routes/post.route";
import { BlockRoute } from "./routes/block.route";
import { BlockService } from "./services/Block.service";
import { CloseFriendRoute } from "./routes/closeFriend.route";
import { CloseFriendService } from "./services/CloseFriend.service";
import { NotificationRoute } from "./routes/notification.route";
import { NotificationService } from "./services/Notification.service";

export const makeApp = (userService:UserService , commentService:CommentService , followService: FollowService , postService : PostService, blockService: BlockService , closeFriendService: CloseFriendService , notificationService: NotificationService) => {

    const app = express()

    
    app.use(cors({
        origin: '*',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['*']
    }));
    


    app.use(express.json())
    app.use(express.urlencoded({ extended: true }))

    //images
    app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));



    // Swagger setup
    const swaggerDocs = swaggerJsDoc(swaggerOptions);
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

    // users
    app.use('/' , UserRoute(userService))

    // posts
    app.use('/' , MakePostRoute(postService))

    // follow
    app.use('/follow', FollowRoute(followService))

    // close friend
    app.use('/', CloseFriendRoute(closeFriendService))

    // block
    app.use('/block', BlockRoute(blockService))

    //comments
    app.use('/', CommentRoute(commentService));

    // notifications
    app.use('/notifications', NotificationRoute(notificationService));

    const errorHandling: express.ErrorRequestHandler = (error, req, res, next) => {

        if (error instanceof Error) {
            res.status(400).json({ message: error });
        }

        res.status(500).send()

    }

    app.use(errorHandling)

    app.use((req, res, next) => {
        res.status(404).send("Not Found!")
    })

    return app
}