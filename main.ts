import { makeApp } from "./src/app"
import MongoDBConnection from "./src/db/connection";
import { Post } from "./src/db/post/post";
import { IUser, User } from "./src/db/user/user.model";
import { PostRepository } from "./src/repositrory/post/post.repository";
import { UserRepository } from "./src/repositrory/user/user.repositroy";
import { UserService } from "./src/services/User.service";
import dotenv from 'dotenv';

dotenv.config();

const postRepo = new PostRepository(Post)
const userRepo = new UserRepository(User);
const userService = new UserService(userRepo, postRepo);

const uri = process.env.MONGO_URI || '';

const dbConnection = new MongoDBConnection(uri);

declare global {
    namespace Express {
        interface Request {
            user: IUser;
        }
    }
};

dbConnection.connect().then(async () => {

    const app = makeApp(userService)

    const PORT = 3000

    app.listen(PORT, () => {
        console.log(`app run on port ${PORT}`)
    })
}).catch(err => console.log("not connected to db"))