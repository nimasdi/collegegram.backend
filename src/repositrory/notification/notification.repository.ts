import mongoose, { Model, Document, Types } from 'mongoose';
import { HttpError } from '../../utility/error-handler';
import { INotification } from '../../db/notification/notification.model';
import { Username } from '../../types/user.types';

type ActionType = "like" | "likePost" | "comment" | "follow" | "followRequest"


export class NotificationtRepository {

    private model: Model<INotification>;

    constructor(model: Model<INotification>) {
        this.model = model;
    }

    private handleDBError = (error: any) => {
        throw new HttpError(500, 'خطای شبکه رخ داده است.')
    }

    async createNotification(actionCreator: Username, actionType: ActionType, targetEntityId: mongoose.Types.ObjectId, targetUser: Username) : Promise<Types.ObjectId> {
        const notif = new this.model({actionCreator, actionType, targetEntityId, targetUser});
        await notif.save().catch((err) => this.handleDBError(err));

        return notif.id
    }

}
