import express from "express"
import { UserService } from "./services/User.service";
import { UserRoute } from "./routes/user.route";
import swaggerJsDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import swaggerOptions from '../swaggerOptions';

var cors = require('cors')

export const makeApp = (userService:UserService) => {

    const app = express()

    
    app.use(cors({
        origin: '*',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['*']
    }));
    


    app.use(express.json())
    app.use(express.urlencoded({ extended: true }))

    // Swagger setup
    const swaggerDocs = swaggerJsDoc(swaggerOptions);
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

    app.use('/' , UserRoute(userService))

    const errorHandling: express.ErrorRequestHandler = (error, req, res, next) => {

        if (error instanceof Error) {
            res.status(400).json({ message: error });
        }

        res.status(500).send()

    }

    app.use(errorHandling)

    app.use((req, res, next) => {
        res.status(404).send("Not Fo    und!")
    })

    return app
}