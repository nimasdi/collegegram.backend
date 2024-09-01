import { Model, Document, Types } from 'mongoose';
import { HttpError } from '../../utility/error-handler';
import { IUserNotification } from '../../db/notification/userNotification.model';


export class UserNotificationtRepository {

    private model: Model<IUserNotification>;

    constructor(model: Model<IUserNotification>) {
        this.model = model;
    }

    private handleDBError = (error: any) => {
        throw new HttpError(500, 'خطای شبکه رخ داده است.')
    }



}
