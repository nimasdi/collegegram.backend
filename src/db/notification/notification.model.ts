import mongoose, { Schema, Document, Model } from 'mongoose';
import { Username } from '../../types/user.types';

enum ActionType {
    LIKE = "like",
    COMMENT = "comment",
    FOLLOW = "follow",
}

enum TargetEntityType {
    POST = "postId",
    COMMENT = "commentId",
    USER = "userId",
}

interface INotification extends Document{
    actionCreator: Username;              // User who performed the action
    actionType: ActionType;               // Type of action performed
    targetEntityType: TargetEntityType;   // The type of entity that was acted upon
    targetEntityId: mongoose.Types.ObjectId; // Use ObjectId type for MongoDB references
    targetUser: Username;                 // User who is the target of the action
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
            enum: Object.values(ActionType),
            required: true,
        },
        targetEntityType: {
            type: String,
            enum: Object.values(TargetEntityType),
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
    },
    {
        timestamps: true,
    }
);

export const Notification: Model<INotification> = mongoose.model<INotification>('Notification', NotificationSchema);

