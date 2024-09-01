import mongoose, { Schema, Document, Model } from 'mongoose';
import { Username } from '../../types/user.types';


interface IUserNotification extends Document {
    username: Username;                    // The user associated with the notification
    notificationId: mongoose.Types.ObjectId; // Reference to a notification document
    seen: boolean;                     
}


const UserNotificationSchema: Schema<IUserNotification> = new Schema(
    {
        username: {
            type: String,                 
            required: true,
            ref: 'User',                  
        },
        notificationId: {
            type: Schema.Types.ObjectId,  
            required: true,
            ref: 'Notification',           
        },
        seen: {
            type: Boolean,
            default: false,               
        },
    },
    {
        timestamps: true,                 
    }
);


export const UserNotification: Model<IUserNotification> = mongoose.model<IUserNotification>('UserNotification', UserNotificationSchema);

