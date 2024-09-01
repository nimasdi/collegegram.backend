import { Types } from "mongoose";
import { NotificationtRepository } from "../repositrory/notification/notification.repository";
import { UserNotificationtRepository } from "../repositrory/notification/userNotification.repository";
import { UserRepository } from "../repositrory/user/user.repositroy";
import { Username } from "../types/user.types";
import { HttpError } from "../utility/error-handler";

export class BlockService {

    constructor(private userNotifiRepo: UserNotificationtRepository, private notifiRepo: NotificationtRepository, private userRepo: UserRepository) {
    }

    async createNotification(): Promise<void> {
        
    }

    async createNotificationForFollowers(blockingUsername: Username, blockerUsername: Username): Promise<void> {
        
    }

    async seenNotification(username:Username, notificationId: string): Promise<void> {
        if (!Types.ObjectId.isValid(notificationId)) {
            throw new HttpError(400, "field invalid")
        }
        
        this.userNotifiRepo.seenNotification(username, new Types.ObjectId(notificationId))
    }
}



