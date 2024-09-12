import { Model } from 'mongoose'
import { HttpError } from '../../utility/error-handler'
import { Username } from '../../types/user.types'
import { IBlock } from '../../db/Block/block.model'
import { IUser } from '../../db/user/user.model'

export interface Block {
    blockerUsername: Username
    blockingUsername: Username
}

export interface blockedUsers {
    blockedList: { username: Username; followerCount: number; followingCount: number }[]
    blockedCount: number
}

export class BlockRepository {
    private model: Model<IBlock>

    constructor(model: Model<IBlock>) {
        this.model = model
    }

    private handleDBError = (error: any) => {
        console.log(error)
        throw new HttpError(500, 'خطای شبکه رخ داده است.')
    }

    async block(blockerUsername: Username, blockingUsername: Username): Promise<void> {
        const block = new this.model({ blockerUsername, blockingUsername })
        await block.save().catch((err) => this.handleDBError(err))
    }

    async unblock(blockerUsername: Username, blockingUsername: Username): Promise<void> {
        await this.model.deleteOne({ blockerUsername, blockingUsername }).catch((err) => this.handleDBError(err))
    }

    async checkBlock(blockerUsername: IUser, blockingUsername: IUser): Promise<Boolean> {
        const BlockExist = await this.model.findOne({ blockerUsername: blockerUsername.username, blockingUsername: blockingUsername.username }).catch((err) => this.handleDBError(err))

        if (!BlockExist) {
            return false
        }
        return true
    }

    async getBlockedUserList(user: Username): Promise<blockedUsers> {
        // Aggregation for followers
        const blockedPipeline = [
            { $match: { blockerUsername: user } },
            {
                $lookup: {
                    from: 'follows',
                    localField: 'blockingUsername',
                    foreignField: 'followingUsername',
                    pipeline: [
                        {
                            $match: {
                                status: 'accepted',
                            },
                        },
                    ],
                    as: 'followers',
                },
            },
            {
                $lookup: {
                    from: 'follows',
                    localField: 'blockingUsername',
                    foreignField: 'followerUsername',
                    pipeline: [
                        {
                            $match: {
                                status: 'accepted',
                            },
                        },
                    ],
                    as: 'following',
                },
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'blockingUsername',
                    foreignField: 'username',
                    as: 'userData',
                },
            },
            {
                $unwind: '$userData',
            },
            {
                $project: {
                    _id: 0,
                    username: '$blockingUsername',
                    imageUrl: '$userData.imageUrl',
                    firstName: '$userData.firstName',
                    lastName: '$userData.lastName',
                    private: '$userData.private',
                    followerCount: { $size: '$followers' },
                    followingCount: { $size: '$following' },
                },
            },
        ]

        const blockedList = await this.model
            .aggregate(blockedPipeline)
            .exec()
            .catch((err) => this.handleDBError(err))

        const blockedCount = blockedList.length

        return {
            blockedList,
            blockedCount,
        }
    }

    async getUserBlockedUsernames(user: Username): Promise<Username[]> {
        const blockedUsers = await this.model
            .find({ blockerUsername: user }, { blockingUsername: 1 })
            .exec()
            .catch((err) => this.handleDBError(err))

        const blockedUsernames = blockedUsers.map((block) => block.blockingUsername)
        return blockedUsernames
    }
}
