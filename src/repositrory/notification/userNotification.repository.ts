import { Model, Document, Types } from 'mongoose';
import { HttpError } from '../../utility/error-handler';
import { IUserNotification } from '../../db/notification/userNotification.model';
import { Username } from '../../types/user.types';


export class UserNotificationtRepository {

    private model: Model<IUserNotification>;

    constructor(model: Model<IUserNotification>) {
        this.model = model;
    }

    private handleDBError = (error: any) => {
        throw new HttpError(500, 'خطای شبکه رخ داده است.')
    }

    async createNotificationForUser(username:Username, notificationId: Types.ObjectId) : Promise<void> {
        const notif = new this.model({username, notificationId, seen: false});
        await notif.save().catch((err) => this.handleDBError(err));
    }

    async seenNotification(username: Username, notificationId: Types.ObjectId){
        const notif = await this.model.findOne({username, notificationId})
        .exec().catch((err) => this.handleDBError(err));

        if(!notif){
            throw new HttpError(400, "notif not Found")
        }

        if(notif.seen){
            throw new HttpError(400, "notif seened before")
        }
        
        notif.seen = true
        await notif.save()
    }

}
