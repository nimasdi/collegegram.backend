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
        // console.log(`User joined room: ${socket.id}`);
    
        socket.emit('session', {
            sessionID: socket.sessionID,
            userID: socket.subject,
            // subject: socket.subject,
        })
    
        // Listen for chat message event
        // socket.on("chatMessage", (msg) => {
        //   console.log("Message received: " + msg);
    
        //   // Broadcast the message to all connected clients
        //   io.emit("chatMessage", msg);
        // });
    
        socket.on('private message', ({ content, to }) => {
            socket.to(to).to(socket.subject).emit('private message', {
                content,
                from: socket.subject,
                to,
            })
        })
    
        // socket.on("joinRoom", ({ room }) => {
        //   socket.join(room);
        //   console.log(`User joined room: ${room}`);
        // });
    
        // socket.on("privateMessage", ({ room, message }) => {
        //   console.log(`received on privateMessage: ${message}`);
        //   io.to(room).emit(message); // Send message to users in the room
        // });
    
        socket.on('disconnect', () => {
            console.log('A user disconnected')
        })
    })
    

    return { app, socketServer };
};
