import { Model, Document, Types } from 'mongoose';
import { HttpError } from '../../utility/error-handler';
import { INotification } from '../../db/notification/notification.model';


export class NotificationtRepository {

    private model: Model<INotification>;

    constructor(model: Model<INotification>) {
        this.model = model;
    }

    private handleDBError = (error: any) => {
        console.log(error)
        throw new HttpError(500, 'خطای شبکه رخ داده است.')
    }

    


}
