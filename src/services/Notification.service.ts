import mongoose, { Types } from "mongoose";
import { NotificationtRepository } from "../repositrory/notification/notification.repository";
import { UserNotificationtRepository } from "../repositrory/notification/userNotification.repository";
import { UserRepository } from "../repositrory/user/user.repositroy";
import { Username } from "../types/user.types";
import { HttpError } from "../utility/error-handler";

enum ActionType {
    LIKE = "like",
    COMMENT = "comment",
    FOLLOW = "follow",
}

export class NotificationService {

    constructor(private userNotifRepo: UserNotificationtRepository, private notifRepo: NotificationtRepository, private userRepo: UserRepository) {
    }

    async createNotification(actionCreator: Username, actionType: ActionType, targetEntityId: mongoose.Types.ObjectId, targetUser: Username, notifUser: Username): Promise<void> {
        const notifId = await this.notifRepo.createNotification(actionCreator,actionType,targetEntityId,targetUser)
        if(notifId){
            this.userNotifRepo.createNotificationForUser(notifUser, notifId)
        }
    }

    async createNotificationForFollowers(blockingUsername: Username, blockerUsername: Username): Promise<void> {
        
    }

    async seenNotification(username:Username, notificationId: string): Promise<void> {
        if (!Types.ObjectId.isValid(notificationId)) {
            throw new HttpError(400, "field invalid")
        }
        
        this.userNotifRepo.seenNotification(username, new Types.ObjectId(notificationId))
    }
}



