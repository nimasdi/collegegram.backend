import { Socket } from 'socket.io'
import { ExtendedError } from 'socket.io/dist/namespace'
import { v4 as uuid } from 'uuid'
import jwt from 'jsonwebtoken'
import { DefaultEventsMap } from 'socket.io/dist/typed-events'

interface JwtPayload {
    sub?: string
    iat?: number
    exp?: number
    [key: string]: any
}

const JWT_SECRET = process.env.JWT_SECRET as string

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined')
}

const sessionStore: Record<string, { sessionID: string; username: string }> = {};

export const socketAuthMiddleware = (socket: Socket, next: (err?: ExtendedError) => void) => {
    const authorizationHeader = socket.handshake.headers.authorization;

    let token: string | undefined;

    if (authorizationHeader && authorizationHeader.startsWith('Bearer ')) {
        token = authorizationHeader.split(' ')[1];
    } else if (socket.handshake.query.token) {
        token = socket.handshake.query.token as string;
    }

    if (!token) {
        return next(new Error('Authorization token not found'));
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

        // Use username instead of sub
        const username = decoded.username;

        if (!username) {
            return next(new Error('Invalid token: missing username'));
        }

        const sessionID = socket.handshake.headers.sessionid as string | undefined;
        if (sessionID && sessionStore[sessionID]) {
            socket.sessionID = sessionID;
            socket.subject = sessionStore[sessionID].username; // Store username instead of sub
        } else {
            const newSessionID = uuid();
            socket.sessionID = newSessionID;
            socket.subject = username; // Use username instead of userID
            sessionStore[newSessionID] = { sessionID: newSessionID, username: username };
        }

        next();
    } catch (error) {
        console.error('JWT verification failed:', error);
        return next(new Error('Invalid token'));
    }
};


