import { SwaggerOptions } from "swagger-ui-express";

const swaggerOptions: SwaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'My API',
            version: '1.0.0',
            description: 'API documentation',
        },
        servers: [
            {
                url: 'http://5.34.195.108:3000',
            },
        ],
    },
    apis: ['./src/routes/*.ts'],
};

export default swaggerOptions;

