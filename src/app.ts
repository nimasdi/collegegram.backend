import express from "express"
import { UserService } from "./services/User.service";
import { UserRoute } from "./routes/user.route";

var cors = require('cors')

export const makeApp = (userService:UserService) => {

    const app = express()

    app.use(cors({
        origin: 'http://localhost:5173', 
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
    }));


    app.use(express.json())
    app.use(express.urlencoded({ extended: true }))

    app.use('/' , UserRoute(userService))

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