import mongoose, { Schema, Document, Model } from 'mongoose';
import { Username } from '../../types/user.types';

enum ActionTypeEnum {
    LIKE = "like",
    COMMENT = "comment",
    FOLLOWREQUEST = "followRequest",
    FOLLOWACCEPTED = "followAccepted",
    FOLLOWDECLINED = "followDeclined" ,
    MENTION = 'mention'
}

type ActionType = 'like' | 'comment' | 'followRequest' | 'followAccepted' | 'followDeclined' | 'mention'



export interface INotification extends Document{
    actionCreator: Username;              // User who performed the action
    actionType: ActionType;               // Type of action performed
    targetEntityId: mongoose.Types.ObjectId; // Use ObjectId type for MongoDB references
    targetUser: Username;
    userImage: string;                 // User who is the target of the action
}

const NotificationSchema: Schema<INotification> = new Schema(
    {
        actionCreator: {
            type: String,
            ref: 'User', 
            required: true,
        },
        actionType: {
            type: String,
            enum: Object.values(ActionTypeEnum),
            required: true,
        },
        targetEntityId: {
            type: Schema.Types.ObjectId,  
            required: true,
            refPath: 'targetEntityType',
        },
        targetUser: {
            type: String,
            ref: 'User',  
            required: true,
        },
        userImage: {
            type: String,
            defualt: ""
        },
    },
    {
        timestamps: true,
    }
);

export const Notification: Model<INotification> = mongoose.model<INotification>('Notification', NotificationSchema);

