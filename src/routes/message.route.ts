import { Router } from 'express'
import { NotificationService } from '../services/Notification.service'
import { handelErrorResponse } from '../utility/habdle-errResponse'
import authMiddleware from '../utility/authorization'
import { MessageService } from '../services/Message.service'

export const ChatRoute = (messageService: MessageService) => {
    const router = Router()

    /**
     * @swagger
     * /message/chatList:
     *   get:
     *     summary: Retrieve user chats
     *     description:  Retrieve user chats
     *     tags:
     *       - Chat
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: chats retrieved successfully
     *       401:
     *         description: Unauthorized. The user must be authenticated to access this endpoint.
     *       500:
     *         description: Internal server error. An error occurred while processing the request.
     */
    router.get('/chatList', authMiddleware ,async (req, res) => {
        try {

            const username = req.user.username;
        
            const chats = await messageService.getChatLists(username)

            res.status(200).json(chats)
        } catch (error) {
            handelErrorResponse(res, error)
        }
    })


    return router
}
