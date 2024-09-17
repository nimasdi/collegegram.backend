import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { socketAuthMiddleware } from './utility/socket-auth.middleware';

export const makeSocketApp = () => {
    const app = express();

    const socketServer = createServer(app);
    
    const io = new Server(socketServer);

    io.use(socketAuthMiddleware);

    io.on('connection', (socket) => {
        console.log('A user connected')
    
        socket.join(socket.subject)
    
        socket.emit('session', {
            sessionID: socket.sessionID,
            userID: socket.subject,
        })
    
    
        socket.on('private message', ({ content, to }) => {
            socket.to(to).to(socket.subject).emit('private message', {
                content,
                from: socket.subject,
                to,
            })
        })
    
        socket.on('disconnect', () => {
            console.log('A user disconnected')
        })
    })
    

    return { app, socketServer };
};
