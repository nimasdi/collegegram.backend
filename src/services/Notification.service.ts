import mongoose, { Types } from 'mongoose'
import { NotificationtRepository } from '../repositrory/notification/notification.repository'
import { UserNotificationtRepository } from '../repositrory/notification/userNotification.repository'
import { UserRepository } from '../repositrory/user/user.repositroy'
import { UserId, Username, isUserId, isUsername } from '../types/user.types'
import { HttpError } from '../utility/error-handler'
import { FollowRepository } from '../repositrory/Follow/follow.repository'
import { BlockRepository } from '../repositrory/Block/block.repository'
import { CloseFriendRepository } from '../repositrory/CloseFriend/closeFriend.repository'

type ActionType = 'like' | 'likePost' | 'comment' | 'follow' | 'followRequest'

export class NotificationService {
    constructor(private userNotifRepo: UserNotificationtRepository, private notifRepo: NotificationtRepository, private userRepo: UserRepository, private followRepo: FollowRepository, private blockRepo: BlockRepository, private closeRepo: CloseFriendRepository) {}

    private async findUsename(targetUser: string): Promise<Username | null> {
        let username = ''
        if (isUserId(targetUser)) {
            const user = await this.userRepo.getUsernameByUserId(targetUser)
            if (user) {
                username = user
            }
        } else {
            username = targetUser
        }

        if (isUsername(username)) return username
        return null
    }

    async createNotification(actionCreator: Username, actionType: ActionType, targetEntityId: mongoose.Types.ObjectId, targetUser: string): Promise<void> {
        const targetUsername = await this.findUsename(targetUser)
        if (targetUsername) {
            if (targetUsername !== actionCreator) {
                const userExist = await this.userRepo.getUserByUsername(targetUsername)
                if (userExist) {
                    const notifId = await this.notifRepo.createNotification(actionCreator, actionType, targetEntityId, targetUsername)
                    if (notifId) {
                        this.userNotifRepo.createNotificationForUser(targetUsername, notifId)
                    }
                }
            }
        }
    }

    async createNotificationForFollowers(actionCreator: Username, actionType: ActionType, targetEntityId: mongoose.Types.ObjectId, targetUser: string, checkClose: Boolean): Promise<void> {
        const targetUsername = await this.findUsename(targetUser)
        console.log(targetUsername)
        if (targetUsername) {
            const followers = await this.followRepo.getFollowersList(actionCreator)
            console.log(followers)
            if (followers.length > 0) {
                const notifId = await this.notifRepo.createNotification(actionCreator, actionType, targetEntityId, targetUsername)
                if (notifId) {
                    for (const follower of followers) {
                        // check target user not block follower
                        const Block = await this.blockRepo.checkBlock(targetUsername, follower)

                        // check target user page is public or private and follower , follow target user and then check closeFriend
                        let checkPrivate: Boolean = false
                        let closeFriend: Boolean = false
                        const userData = await this.userRepo.getUserByUsername(targetUsername)
                        if (userData) {
                            if (!userData.private) checkPrivate = true
                            else {
                                const follow = await this.followRepo.checkFollow(follower, targetUsername)
                                if (follow) checkPrivate = true
                                // check close friend if check close is true
                                if (checkClose && follow) closeFriend = await this.closeRepo.checkCloseFriend(follower, targetUsername)
                            }
                        }

                        if (!Block && checkPrivate && (!checkClose || closeFriend)) {
                            this.userNotifRepo.createNotificationForUser(follower, notifId)
                        }
                    }
                }
            }
        }
    }

    async seenNotification(username: Username, notificationId: string): Promise<void> {
        if (!Types.ObjectId.isValid(notificationId)) {
            throw new HttpError(400, 'field invalid')
        }

        this.userNotifRepo.seenNotification(username, new Types.ObjectId(notificationId))
    }

    async getUserNotification(username: Username ,pageNumber: number = 1, pageSize: number = 10 ): Promise<any> {
        const notificationIds = await this.userNotifRepo.getUserNotification(username)

        if (!notificationIds || notificationIds.length === 0) {
            return []
        }

        const notifications = await this.notifRepo.getNotificationData(notificationIds, username, pageNumber, pageSize, 'self')

        return notifications
    }

    async getFriendsNotification(username: Username ,pageNumber: number = 1, pageSize: number = 10 ): Promise<any> {
        const notificationIds = await this.userNotifRepo.getUserNotification(username)

        if (!notificationIds || notificationIds.length === 0) {
            return []
        }

        const notifications = await this.notifRepo.getNotificationData(notificationIds, username, pageNumber, pageSize, 'friend')

        return notifications
    }
}
