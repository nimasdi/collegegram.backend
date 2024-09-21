import mongoose, { Model, Document, Types } from 'mongoose'
import { HttpError } from '../../utility/error-handler'
import { INotification } from '../../db/notification/notification.model'
import { Username } from '../../types/user.types'

type ActionType = 'like' | 'comment' | 'followRequest' | 'followAccepted' | 'followDeclined' | 'mention'

export interface getUserNotifs {
    id: Types.ObjectId
    actionCreator: Username
    actionType: ActionType
    targetEntityId: Types.ObjectId
    targetUser: Username
    commentText: string
    postId: Types.ObjectId
    notifId: Types.ObjectId
    postImage: string
}

export class NotificationtRepository {
    private model: Model<INotification>

    constructor(model: Model<INotification>) {
        this.model = model
    }

    private handleDBError = (error: any) => {
        throw new HttpError(500, 'خطای شبکه رخ داده است.')
    }

    async createNotification(actionCreator: Username, actionType: ActionType, targetEntityId: mongoose.Types.ObjectId, targetUser: Username, userImage: string): Promise<Types.ObjectId> {
        const notif = new this.model({ actionCreator, actionType, targetEntityId, targetUser, userImage })
        await notif.save().catch((err) => this.handleDBError(err))

        return notif.id
    }

    async changeFollowNotif(actionCreator:Username, targetUser: Username, changeType: 'followAccepted' | 'followDeclined'){
        const notif = await this.model.findOne({actionCreator, targetUser, actionType:'followRequest'})

        if(!notif){
            throw new HttpError(404, "not found")
        }
        
        notif.actionType = changeType

        await notif.save()
    }

    async getNotificationData(notificationsId: Types.ObjectId[], username: Username, pageNumber: number = 1, pageSize: number = 10, type: 'friend' | 'self'): Promise<getUserNotifs[]> {
        const skip = (pageNumber - 1) * pageSize

        const matchQuery = type === 'friend' ? { _id: { $in: notificationsId } , targetUser : {  $ne : username } , actionType : {$ne : 'followDeclined'} }: { _id: { $in: notificationsId } , targetUser : username,  actionType : {$ne : 'followDeclined'} }

        const notifs = await this.model
            .aggregate([
                { $match: matchQuery },
                {
                    $lookup: {
                        from: 'usernotifications',
                        localField: '_id',
                        foreignField: 'notificationId',
                        pipeline: [
                            {
                                $match: {
                                    username: username
                                }
                            }
                        ],
                        as: 'notifState'
                    },
                },
                {
                    $lookup: {
                        from: 'comments',

                        let: { targetId: '$targetEntityId', actionType: '$actionType' },

                        pipeline: [{ $match: { $expr: { $and: [{ $eq: ['$_id', '$$targetId'] }, { $eq: ['$$actionType', 'comment'] }] } } }, { $project: { text: 1 , postId: 1 } }],

                        as: 'commentData',
                    },
                },
                {
                    $lookup: {
                        from: 'posts',

                        let: { targetId: '$targetEntityId', actionType: '$actionType' },

                        pipeline: [{ $match: { $expr: { $and: [{ $eq: ['$_id', '$$targetId'] }, { $in: ['$$actionType', ['like','comment','mention']] }] } } }, { $project: { _id: 1 , images: 1 } }],

                        as: 'postData',
                    },
                },

                { $unwind: { path: '$commentData', preserveNullAndEmptyArrays: true } },

                { $unwind: { path: '$postData', preserveNullAndEmptyArrays: true } },

                { $unwind : '$notifState' } ,

                {
                    $project: {
                        _id: 1,

                        actionCreator: 1,

                        actionType: 1,

                        targetEntityId: 1,

                        targetUser: 1,

                        createdAt: 1,

                        commentText: '$commentData.text',

                        commentPostId: '$commentData.postId',

                        postId: '$postData._id',

                        postImage: '$postData.images[0]',

                        seen : '$notifState.seen',

                        notifId: '$notifState._id'
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
            postId: notif.actionType === 'comment' ? notif.commentPostId : notif.postId,
            postImage: notif.postImage,
            seen: notif.seen,
            notifId: notif.notifId,
            createdAt: notif.createdAt
        }))
    }
}
