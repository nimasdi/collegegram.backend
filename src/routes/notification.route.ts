import { Router } from 'express'
import { NotificationService } from '../services/Notification.service'
import { handelErrorResponse } from '../utility/habdle-errResponse'
import authMiddleware from '../utility/authorization'

export const NotificationRoute = (notificationService: NotificationService) => {
    const router = Router()

    /**
     * @swagger
     * /notifications/me:
     *   get:
     *     summary: Retrieve user notifications
     *     description: Fetch notifications for the logged-in user with optional pagination.
     *     tags:
     *       - Notifications
     *     parameters:
     *       - in: query
     *         name: pageNumber
     *         required: false
     *         description: The page number for pagination. Defaults to 1.
     *         schema:
     *           type: integer
     *           default: 1
     *       - in: query
     *         name: pageSize
     *         required: false
     *         description: The number of notifications per page. Defaults to 10.
     *         schema:
     *           type: integer
     *           default: 10
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Notifications retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 type: object
     *                 properties:
     *                   id:
     *                     type: string
     *                     description: The unique identifier of the notification.
     *                   actionCreator:
     *                     type: string
     *                     description: The username of the user who performed the action.
     *                   actionType:
     *                     type: string
     *                     description: The type of action that triggered the notification.
     *                     enum:
     *                       - like
     *                       - likePost
     *                       - comment
     *                       - follow
     *                       - followRequest
     *                   targetEntityId:
     *                     type: string
     *                     description: The ID of the entity that the action was performed on (comment or post).
     *                   targetUser:
     *                     type: string
     *                     description: The username of the user who is the target of the action.
     *                   commentText:
     *                     type: string
     *                     description: The text of the comment if the notification is about a comment.
     *                   postUrl:
     *                     type: string
     *                     description: The URL of the post if the notification is about a post.
     *       401:
     *         description: Unauthorized. The user must be authenticated to access this endpoint.
     *       500:
     *         description: Internal server error. An error occurred while processing the request.
     */
    router.get('/me', authMiddleware ,async (req, res) => {
        try {

            const username = req.user.username;
            const pageNumber = req.query.pageNumber ? parseInt(req.query.pageNumber as string) : undefined;
            const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string) : undefined;

            const notifications = await notificationService.getUserNotification(username, pageNumber, pageSize)

            res.status(200).json(notifications)
        } catch (error) {
            handelErrorResponse(res, error)
        }
    })

    /**
     * @swagger
     * /notifications/myFriends:
     *   get:
     *     summary: Retrieve user notifications
     *     description: Fetch notifications for the logged-in user with optional pagination.
     *     tags:
     *       - Notifications
     *     parameters:
     *       - in: query
     *         name: pageNumber
     *         required: false
     *         description: The page number for pagination. Defaults to 1.
     *         schema:
     *           type: integer
     *           default: 1
     *       - in: query
     *         name: pageSize
     *         required: false
     *         description: The number of notifications per page. Defaults to 10.
     *         schema:
     *           type: integer
     *           default: 10
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Notifications retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 type: object
     *                 properties:
     *                   id:
     *                     type: string
     *                     description: The unique identifier of the notification.
     *                   actionCreator:
     *                     type: string
     *                     description: The username of the user who performed the action.
     *                   actionType:
     *                     type: string
     *                     description: The type of action that triggered the notification.
     *                     enum:
     *                       - like
     *                       - likePost
     *                       - comment
     *                       - follow
     *                       - followRequest
     *                   targetEntityId:
     *                     type: string
     *                     description: The ID of the entity that the action was performed on (comment or post).
     *                   targetUser:
     *                     type: string
     *                     description: The username of the user who is the target of the action.
     *                   commentText:
     *                     type: string
     *                     description: The text of the comment if the notification is about a comment.
     *                   postUrl:
     *                     type: string
     *                     description: The URL of the post if the notification is about a post.
     *       401:
     *         description: Unauthorized. The user must be authenticated to access this endpoint.
     *       500:
     *         description: Internal server error. An error occurred while processing the request.
     */
    router.get('/myFriends', authMiddleware ,async (req, res) => {
        try {

            const username = req.user.username;
            const pageNumber = req.query.pageNumber ? parseInt(req.query.pageNumber as string) : undefined;
            const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string) : undefined;

            const notifications = await notificationService.getFriendsNotification(username, pageNumber, pageSize)

            res.status(200).json(notifications)
        } catch (error) {
            handelErrorResponse(res, error)
        }
    })

    return router
}
