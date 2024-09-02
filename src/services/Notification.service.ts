import mongoose, { Types } from "mongoose";
import { NotificationtRepository } from "../repositrory/notification/notification.repository";
import { UserNotificationtRepository } from "../repositrory/notification/userNotification.repository";
import { UserRepository } from "../repositrory/user/user.repositroy";
import { UserId, Username, isUserId, isUsername } from "../types/user.types";
import { HttpError } from "../utility/error-handler";
import { FollowRepository } from "../repositrory/Follow/follow.repository";

type ActionType = "like" | "likePost" | "comment" | "follow" 

export class NotificationService {

    constructor(private userNotifRepo: UserNotificationtRepository, private notifRepo: NotificationtRepository, private userRepo: UserRepository, private followRepo: FollowRepository) {
    }

    async createNotification(actionCreator: Username, actionType: ActionType, targetEntityId: mongoose.Types.ObjectId, targetUser: string): Promise<void> {
        let username = ''
        if(isUserId(targetUser)){
            const user = await this.userRepo.getUsernameByUserId(targetUser)
            if(user){
                username = user 
            }
        }else{
            username = targetUser
        }
        if(isUsername(username)){
            const userExist = await this.userRepo.getUserByUsername(username)
            if(userExist){
                const notifId = await this.notifRepo.createNotification(actionCreator,actionType,targetEntityId,username)
                if(notifId){
                    this.userNotifRepo.createNotificationForUser(username, notifId)
                }
            }
        }
    }

    async createNotificationForFollowers(actionCreator: Username, actionType: ActionType, targetEntityId: mongoose.Types.ObjectId, targetUser: Username): Promise<void> {

        const followers = await this.followRepo.getFollowersList(actionCreator)
        if(followers.length > 0){
            const notifId = await this.notifRepo.createNotification(actionCreator,actionType,targetEntityId,targetUser)
            if(notifId){
                for(const follower of followers){
                    this.userNotifRepo.createNotificationForUser(follower, notifId)
                }
            }
        }
        
    }

    async seenNotification(username:Username, notificationId: string): Promise<void> {
        if (!Types.ObjectId.isValid(notificationId)) {
            throw new HttpError(400, "field invalid")
        }
        
        this.userNotifRepo.seenNotification(username, new Types.ObjectId(notificationId))
    }
}



