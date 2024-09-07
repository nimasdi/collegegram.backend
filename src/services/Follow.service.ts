import { Types } from "mongoose";
import { FollowRequestDto } from "../dto/followRequest.dto";
import { FollowRequestActionDto } from "../dto/followRequestAction.dto";
import { BlockRepository } from "../repositrory/Block/block.repository";
import { FollowRepository, followingAndFollowers } from "../repositrory/Follow/follow.repository";
import { UserRepository } from "../repositrory/user/user.repositroy";
import { Username } from "../types/user.types";
import { HttpError } from "../utility/error-handler";
import { NotificationService } from "./Notification.service";
import { ActionType, publishToQueue } from "../rabbitMq/rabbit";

export interface followState {
    followerCount: Number,
    followingCount: Number
}

export class FollowService {

    constructor(private followRepo: FollowRepository, private notifServise: NotificationService, private userRepo: UserRepository , private blockRepo: BlockRepository) {
    }

    // async follow(followingUsername: Username, followerUsername: Username): Promise<void> {
    //     const follwingUserExist = await this.userRepo.getUserByUsername(followingUsername)
    //     if (!follwingUserExist) {
    //         throw new HttpError(400, "following not found")
    //     }
    //     const existFollow = await this.followRepo.checkFollow(followerUsername, followingUsername)
    //     if (existFollow) {
    //         throw new HttpError(400, "user followed before.")
    //     }
        
    //     const blocked = await this.blockRepo.checkBlock(followerUsername , followingUsername)
    //     const isReceiverBlocked = await this.blockRepo.checkBlock(followingUsername, followerUsername)

    //     if (isReceiverBlocked){
    //         throw new HttpError(403, `${followerUsername} is blocked`);
    //     }
    //     else if(blocked){
    //         throw new HttpError(403, `${followingUsername} is blocked`);
    //     }

    //     await this.followRepo.follow(followerUsername, followingUsername)
    // }

    async unfollow(followingUsername: Username, followerUsername: Username): Promise<void> {
        const follwingUserExist = await this.userRepo.getUserByUsername(followingUsername)
        if (!follwingUserExist) {
            throw new HttpError(400, "user not found")
        }
        const existFollow = await this.followRepo.checkFollow(followerUsername, followingUsername)
        if (!existFollow) {
            throw new HttpError(400, "follow relation not found")
        }
        await this.followRepo.unfollow(followerUsername, followingUsername)

    }

    async removeFollowing(followingUsername: Username, followerUsername: Username): Promise<void> {
        const follwerUserExist = await this.userRepo.getUserByUsername(followerUsername)
        if (!follwerUserExist) {
            throw new HttpError(400, "user not found")
        }
        const existFollow = await this.followRepo.checkFollow(followerUsername, followingUsername)
        if (!existFollow) {
            throw new HttpError(400, "follow relation not found")
        }
        await this.followRepo.removeFollowing(followerUsername, followingUsername)

    }

    async checkFollow(followingUsername: Username, followerUsername: Username): Promise<string> {
        
        const followed = await this.followRepo.checkFollow(followerUsername, followingUsername)

        const senderIsBlocked = await this.blockRepo.checkBlock(followerUsername , followingUsername)
        const isReceiverBlocked = await this.blockRepo.checkBlock(followingUsername, followerUsername)

        if (isReceiverBlocked){
            return 'blocked'
        }
        else if(senderIsBlocked){
            return 'blocked'
        }

        return followed
    }

    async getUserFollowState(username: Username): Promise<followState> {
        const user = await this.userRepo.checkUserExist(username)
        if (!user) {
            throw new HttpError(404, "user not found")
        }
        const followerCount = await this.followRepo.getFollowerCount(username)
        const followingCount = await this.followRepo.getFollowingCount(username)

        return {
            followerCount,
            followingCount
        }
    }

    async getFollowersAndFollowing(username: Username): Promise<followingAndFollowers> {
        const followingAndFollowers = this.followRepo.getFollowersAndFollowing(username)
        return followingAndFollowers
    }

    async sendFollowRequest(followRequestData: FollowRequestDto) {
        const { receiver, sender } = followRequestData

        const senderExist = this.userRepo.checkUserExist(sender)
        if (!sender) {
            throw new HttpError(404, "user not found")
        }
        const receiverExist = this.userRepo.checkUserExist(receiver)
        if (!receiver) {
            throw new HttpError(404, "user not found")
        }

        const senderIsBlocked = await this.blockRepo.checkBlock(receiver , sender)
        const isReceiverBlocked = await this.blockRepo.checkBlock(sender, receiver)

        if (isReceiverBlocked){
            throw new HttpError(403, `${receiver} is blocked by ${sender}`);
        }
        else if(senderIsBlocked){
            throw new HttpError(403, `${sender} is blocked by ${receiver}`);
        }

        const followReq = await this.followRepo.sendFollowRequest(followRequestData)
        this.notifServise.createNotification(sender, "follow" , followReq , receiver)        

    }


    async acceptOrDeclineFollowRequest(followRequestActionData: FollowRequestActionDto): Promise<Boolean | Types.ObjectId> {
        const { receiver, sender, action } = followRequestActionData

        const senderIsBlocked = await this.blockRepo.checkBlock(receiver , sender)
        const isReceiverBlocked = await this.blockRepo.checkBlock(sender, receiver)

        if (isReceiverBlocked){
            throw new HttpError(403, `${receiver} is blocked by ${sender}`);
        }
        else if(senderIsBlocked){
            throw new HttpError(403, `${sender} is blocked by ${receiver}`);
        }

        const senderExist = this.userRepo.checkUserExist(sender)
        if (!senderExist) {
            throw new HttpError(404, "user not found")
        }
        const receiverExist = this.userRepo.checkUserExist(receiver)
        if (!receiverExist) {
            throw new HttpError(404, "user not found")
        }
        
        const followRequest = await this.followRepo.findRequest(receiver, sender);

        if (!followRequest) {
            throw new HttpError(400, "Follow request not found or already processed");
        }

        // Update the follow request status in the repository
        const result = await this.followRepo.acceptOrDeclineFollowRequest({
            sender,
            receiver,
            action
        });

        // if(action === 'accept'){
        //     this.notifServise.createNotification(sender, "follow" , result , receiver)        
        //     this.notifServise.createNotificationForFollowers(sender, "follow" , result , receiver, false)        
        // }
        if(action === 'accept'){
            const notificationPayload = {
                actionCreator: sender,
                actionType: "follow" as ActionType,
                targetEntityId: result,
                targetUser: receiver,
                checkClose: false
            };
    
            // Publish the task to create a notification
            await publishToQueue('notification_queue', notificationPayload);
        }       

        return result;

    }


}



