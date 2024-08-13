import { makeApp } from "./src/app"
import MongoDBConnection from "./src/db/connection";
import { User } from "./src/db/user/user.model";
import { UserRepository } from "./src/repositrory/user/user.repositroy";
import { UserService } from "./src/services/User.service";
import dotenv from 'dotenv';

dotenv.config();

const userRepo = new UserRepository(User);
const userService = new UserService(userRepo);

// const uri = process.env.MONGO_URI || '';
const uri = "mongodb://localhost:27017/mydatabase"

const dbConnection = new MongoDBConnection(uri);

dbConnection.connect().then(async () => {

    const app = makeApp(userService)

    const PORT = 3000

    app.listen(PORT,() => {
        console.log(`app run on port ${PORT}`)
    })
}).catch(err => console.log("not connected to db"))