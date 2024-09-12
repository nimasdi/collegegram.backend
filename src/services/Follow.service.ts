import { Types } from 'mongoose'
import { FollowRequestDto } from '../dto/followRequest.dto'
import { FollowRequestActionDto } from '../dto/followRequestAction.dto'
import { BlockRepository } from '../repositrory/Block/block.repository'
import { FollowRepository, IRelationshipManger, followingAndFollowers } from '../repositrory/Follow/follow.repository'
import { SameUserError, UserRepository } from '../repositrory/user/user.repositroy'
import { Username } from '../types/user.types'
import { HttpError } from '../utility/error-handler'
import { NotificationService } from './Notification.service'
import { ActionType, publishToQueue } from '../rabbitMq/rabbit'
import { LoggedInUser } from '../types/user-auth'
import { match } from 'ts-pattern'
import { Relationship } from '../types/relationship'

export interface followState {
    followerCount: Number
    followingCount: Number
}

export class FollowService {
    constructor(private followRepo: FollowRepository, private notifServise: NotificationService, private userRepo: UserRepository, private blockRepo: BlockRepository, private relationShipManager: IRelationshipManger) {}

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

    async follow(loggedInUser: LoggedInUser, followUsername: Username): Promise<void> {
        const user = await this.userRepo.getUserByEmailOrUsername(followUsername, loggedInUser)

        if (user === null) {
            throw new HttpError(404, 'user not found')
        }

        if (user instanceof SameUserError) {
            throw new HttpError(400, 'you can not follow yourself')
        }

        const relationship = await this.relationShipManager.getRelationship(loggedInUser, user)

        if (relationship._tag === 'Blocked') {
            throw new HttpError(
                403,
                match(relationship.status)
                    .with('blockedByLoggedInUser', () => `${loggedInUser.username} is blocked by ${user.username}`)
                    .with('blockedByUser', () => `${user.username} is blocked by ${loggedInUser.username}`)
                    .with('bothBlocked', () => `${loggedInUser.username} and ${user.username} are blocked by each other`)
                    .exhaustive()
            )
        }

        if (relationship._tag === 'Following' && !Relationship.Following.isDeclined(relationship)) {
            throw new HttpError(400, 'user followed before.')
        }

        await this.relationShipManager.followRequest(relationship)
    }

    async unfollow(followingUsername: Username, followerUsername: Username): Promise<void> {
        const follwingUserExist = await this.userRepo.getUserByUsername(followingUsername)
        if (!follwingUserExist) {
            throw new HttpError(400, 'user not found')
        }
        const existFollow = await this.followRepo.checkFollow(followerUsername, followingUsername)
        if (!existFollow) {
            throw new HttpError(400, 'follow relation not found')
        }
        await this.followRepo.unfollow(followerUsername, followingUsername)
    }

    async removeFollowing(followingUsername: Username, followerUsername: Username): Promise<void> {
        const follwerUserExist = await this.userRepo.getUserByUsername(followerUsername)
        if (!follwerUserExist) {
            throw new HttpError(400, 'user not found')
        }
        const existFollow = await this.followRepo.checkFollow(followerUsername, followingUsername)
        if (!existFollow) {
            throw new HttpError(400, 'follow relation not found')
        }
        await this.followRepo.removeFollowing(followerUsername, followingUsername)
    }

    async checkFollow(followingUsername: Username, followerUsername: Username): Promise<string> {
        const followed = await this.followRepo.checkFollow(followerUsername, followingUsername)

        const senderIsBlocked = await this.blockRepo.checkBlock(followerUsername, followingUsername)
        const isReceiverBlocked = await this.blockRepo.checkBlock(followingUsername, followerUsername)

        if (isReceiverBlocked) {
            return 'blocked'
        } else if (senderIsBlocked) {
            return 'blocked'
        }

        return followed
    }

    async getUserFollowState(username: Username): Promise<followState> {
        const user = await this.userRepo.checkUserExist(username)
        if (!user) {
            throw new HttpError(404, 'user not found')
        }
        const followerCount = await this.followRepo.getFollowerCount(username)
        const followingCount = await this.followRepo.getFollowingCount(username)

        return {
            followerCount,
            followingCount,
        }
    }

    async getFollowersAndFollowing(username: Username): Promise<followingAndFollowers> {
        const followingAndFollowers = this.followRepo.getFollowersAndFollowing(username)
        return followingAndFollowers
    }

    async sendFollowRequest(loggedInUser: LoggedInUser, followRequestData: FollowRequestDto) {
        const { receiver: receiverUsername, sender: senderUsername } = followRequestData

        const sender = await this.userRepo.checkUserExist(senderUsername)
        if (!sender) {
            throw new HttpError(404, 'user not found')
        }
        const receiver = await this.userRepo.checkUserExist(receiverUsername)
        if (!receiver) {
            throw new HttpError(404, 'user not found')
        }

        const senderIsBlocked = await this.blockRepo.checkBlock(receiver, sender)
        const isReceiverBlocked = await this.blockRepo.checkBlock(sender, receiver)

        if (isReceiverBlocked) {
            throw new HttpError(403, `${receiver} is blocked by ${sender}`)
        } else if (senderIsBlocked) {
            throw new HttpError(403, `${sender} is blocked by ${receiver}`)
        }

        const followReq = await this.followRepo.sendFollowRequest(followRequestData)

        const notificationPayload = {
            actionCreator: sender.username,
            actionType: 'followRequest' as ActionType,
            targetEntityId: followReq,
            targetUser: receiver.username,
            checkClose: false,
        }

        // Publish the task to create a notification
        await publishToQueue('notification_queue', notificationPayload)

        // this.notifServise.createNotification(sender, "follow" , followReq , receiver)
    }

    async acceptOrDeclineFollowRequest(followRequestActionData: FollowRequestActionDto): Promise<Boolean | Types.ObjectId> {
        const { receiver, sender, action } = followRequestActionData

        const senderIsBlocked = await this.blockRepo.checkBlock(receiver, sender)
        const isReceiverBlocked = await this.blockRepo.checkBlock(sender, receiver)

        if (isReceiverBlocked) {
            throw new HttpError(403, `${receiver} is blocked by ${sender}`)
        } else if (senderIsBlocked) {
            throw new HttpError(403, `${sender} is blocked by ${receiver}`)
        }

        const senderExist = this.userRepo.checkUserExist(sender)
        if (!senderExist) {
            throw new HttpError(404, 'user not found')
        }
        const receiverExist = this.userRepo.checkUserExist(receiver)
        if (!receiverExist) {
            throw new HttpError(404, 'user not found')
        }

        const followRequest = await this.followRepo.findRequest(receiver, sender)

        if (!followRequest) {
            throw new HttpError(400, 'Follow request not found or already processed')
        }

        // Update the follow request status in the repository
        const result = await this.followRepo.acceptOrDeclineFollowRequest({
            sender,
            receiver,
            action,
        })

        // if(action === 'accept'){
        //     this.notifServise.createNotification(sender, "follow" , result , receiver)
        //     this.notifServise.createNotificationForFollowers(sender, "follow" , result , receiver, false)
        // }
        if (action === 'accept') {
            const notificationPayload = {
                actionCreator: sender,
                actionType: 'follow' as ActionType,
                targetEntityId: result,
                targetUser: receiver,
                checkClose: false,
            }

            // Publish the task to create a notification
            await publishToQueue('notification_queue', notificationPayload)
        }

        return result
    }

    async cancelFollowRequest(followRequestData: FollowRequestDto): Promise<void> {
        const { sender, receiver } = followRequestData

        const senderExist = await this.userRepo.checkUserExist(sender)
        if (!senderExist) {
            throw new HttpError(404, 'Sender user not found.')
        }

        const receiverExist = await this.userRepo.checkUserExist(receiver)
        if (!receiverExist) {
            throw new HttpError(404, 'Receiver user not found.')
        }

        const senderIsBlocked = await this.blockRepo.checkBlock(receiver, sender)
        const isReceiverBlocked = await this.blockRepo.checkBlock(sender, receiver)

        if (isReceiverBlocked) {
            throw new HttpError(403, `${receiver} is blocked by ${sender}`)
        } else if (senderIsBlocked) {
            throw new HttpError(403, `${sender} is blocked by ${receiver}`)
        }

        const followRequest = await this.followRepo.findRequest(receiver, sender)
        if (!followRequest) {
            throw new HttpError(400, 'Follow request not found or already canceled.')
        }

        await this.followRepo.deleteFollowRequest(sender, receiver)
    }
}
