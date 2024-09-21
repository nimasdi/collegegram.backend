import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { socketAuthMiddleware } from './utility/socket-auth.middleware'
import { MessageService } from './services/Message.service'
import crypto from 'crypto'
import path from 'path'
import fs from 'fs'

export const makeSocketApp = (app: Express.Application, messageService: MessageService) => {
    const socketServer = createServer(app)

    const io = new Server(socketServer, {
        maxHttpBufferSize: 1e8,
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
            allowedHeaders: ['*'],
            credentials: true,
        },
    })

    io.use(socketAuthMiddleware)

    io.on('connection', (socket) => {
        console.log('A user connected')

        socket.join(socket.subject)

        socket.emit('session', {
            sessionID: socket.sessionID,
            userID: socket.subject,
        })

        socket.on('private message', async ({ content, to }) => {
            try {
                const id = await messageService.createTextMessage(socket.subject, to, content)
                socket.to(to).to(socket.subject).emit('private message', {
                    content,
                    from: socket.subject,
                    to,
                    messageId: id,
                })
            } catch (error) {
                console.error('Error sending private message:', error)
                socket.emit('error', { message: 'Failed to send message.' })
            }
        })

        socket.on('private message image', async ({ fileBuffer, fileName, to }) => {
            try {
                const uniqueSuffix = crypto.randomBytes(8).toString('hex')
                const fileExtension = path.extname(fileName)
                const newFileName = `image-${uniqueSuffix}${fileExtension}`

                const uploadPath = path.join(__dirname, '..', 'src', 'uploads', 'images', 'messages', newFileName)

                fs.writeFile(uploadPath, fileBuffer, async (err) => {
                    if (err) {
                        console.error('Error saving the image file:', err)
                        socket.emit('error', { message: 'Failed to save image.' })
                        return
                    }

                    const contentUrl = `${process.env.HOST}/images/messages/${newFileName}`
                    const id = await messageService.createImageMessage(socket.subject, to, contentUrl)

                    socket.to(to).to(socket.subject).emit('private message image', {
                        content: contentUrl,
                        from: socket.subject,
                        to,
                        messageId: id,
                    })
                })
            } catch (error) {
                console.error('Error handling private message image:', error)
                socket.emit('error', { message: 'Failed to send image.' })
            }
        })

        socket.on('seen messages', async ({ messageIds, receiver }) => {
            try {
                await messageService.seenMessages(messageIds, receiver)
                socket.emit('seen messages ack', { messageIds })
            } catch (error) {
                console.error('Error marking messages as seen:', error)
                socket.emit('error', { message: 'Failed to mark messages as seen.' })
            }
        })

        socket.on('get messages', async ({ receiver, pageNumber, pageSize }) => {
            try {
                const messages = await messageService.getMessages(receiver, pageNumber, pageSize)
                socket.emit('get messages', { messages })
            } catch (error) {
                console.error('Error retrieving messages:', error)
                socket.emit('error', { message: 'Failed to retrieve messages.' })
            }
        })

        socket.on('disconnect', () => {
            console.log('A user disconnected')
        })
    })

    return socketServer
}
