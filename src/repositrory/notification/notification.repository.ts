import mongoose, { Model, Document, Types } from 'mongoose'
import { HttpError } from '../../utility/error-handler'
import { INotification } from '../../db/notification/notification.model'
import { Username } from '../../types/user.types'

type ActionType = 'like' | 'likePost' | 'comment' | 'follow' | 'followRequest'

export interface getUserNotifs {
    id: Types.ObjectId
    actionCreator: Username
    actionType: ActionType
    targetEntityId: Types.ObjectId
    targetUser: Username
    commentText: string
    postUrl: string
}
export class NotificationtRepository {
    private model: Model<INotification>

    constructor(model: Model<INotification>) {
        this.model = model
    }

    private handleDBError = (error: any) => {
        throw new HttpError(500, 'خطای شبکه رخ داده است.')
    }

    async createNotification(actionCreator: Username, actionType: ActionType, targetEntityId: mongoose.Types.ObjectId, targetUser: Username): Promise<Types.ObjectId> {
        const notif = new this.model({ actionCreator, actionType, targetEntityId, targetUser })
        await notif.save().catch((err) => this.handleDBError(err))

        return notif.id
    }

    async getUserNotificationData(notificationsId: Types.ObjectId[], pageNumber: number = 1, pageSize: number = 10): Promise<getUserNotifs[]> {
        const skip = (pageNumber - 1) * pageSize

        const notifs = await this.model
            .aggregate([
                { $match: { _id: { $in: notificationsId } } },
                {
                    $lookup: {
                        from: 'comments',

                        let: { targetId: '$targetEntityId', actionType: '$actionType' },

                        pipeline: [{ $match: { $expr: { $and: [{ $eq: ['$_id', '$$targetId'] }, { $eq: ['$$actionType', 'comment'] }] } } }, { $project: { text: 1 } }],

                        as: 'commentData',
                    },
                },

                {
                    $lookup: {
                        from: 'posts',

                        let: { targetId: '$targetEntityId', actionType: '$actionType' },

                        pipeline: [{ $match: { $expr: { $and: [{ $eq: ['$_id', '$$targetId'] }, { $in: ['$$actionType', ['likePost']] }] } } }, { $project: { url: 1 } }],

                        as: 'postData',
                    },
                },

                { $unwind: { path: '$commentData', preserveNullAndEmptyArrays: true } },

                { $unwind: { path: '$postData', preserveNullAndEmptyArrays: true } },

                {
                    $project: {
                        _id: 1,

                        actionCreator: 1,

                        actionType: 1,

                        targetEntityId: 1,

                        targetUser: 1,

                        commentText: '$commentData.text',

                        postUrl: '$postData.url',
                    },
                },

                { $sort: { createdAt: -1 } },

                { $skip: skip },

                { $limit: pageSize },
            ])
            .exec()

        return notifs.map((notif) => ({
            id: notif._id,
            actionCreator: notif.actionCreator,
            actionType: notif.actionType,
            targetEntityId: notif.targetEntityId,
            targetUser: notif.targetUser,
            commentText: notif.commentText,
            postUrl: notif.postUrl,
        }))
    }
}
