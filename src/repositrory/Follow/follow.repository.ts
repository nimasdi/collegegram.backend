import { Model, Types } from "mongoose";
import { HttpError } from "../../utility/error-handler";
import { IFollow } from "../../db/Follow/follow.model";
import { UserId, Username } from "../../types/user.types";

export interface Follow {
    followingUserName: Username,
    followerUserName: Username,
}

export interface followingAndFollowers {
    followers: { username: Username, followerCount: number, followingCount: number }[];
    following: { username: Username, followerCount: number, followingCount: number }[];
    followerCount: number;
    followingCount: number;
}

export interface followRequest {
    sender: Username,
    receiver: Username
}

interface followRequestAction {
    sender: string;
    receiver: string;
    action: 'accept' | 'decline';
}

export class FollowRepository {

    private model: Model<IFollow>;

    constructor(model: Model<IFollow>) {
        this.model = model;
    }

    private handleDBError = (error: any) => {
        console.log(error)
        throw new HttpError(500, 'خطای شبکه رخ داده است.')
    }

    async follow(followerUsername: Username, followingUsername: Username): Promise<void> {
        const user = new this.model({ followerUsername, followingUsername });
        await user.save().catch((err) => this.handleDBError(err));
    }

    async unfollow(followerUsername: Username, followingUsername: Username): Promise<void> {
        await this.model.deleteOne({ followingUsername, followerUsername })
            .catch((err) => this.handleDBError(err));
    }

    async removeFollowing(followerUsername: Username, followingUsername: Username): Promise<void> {
        await this.model.deleteOne({ followingUsername, followerUsername })
            .catch((err) => this.handleDBError(err));
    }

    async checkFollow(followerUsername: Username, followingUsername: Username): Promise<Boolean> {
        const followExist = await this.model.findOne({ followingUsername, followerUsername })
            .catch((err) => this.handleDBError(err))

        if (!followExist) {
            return false
        }
        return true
    }

    async getFollowerCount(user: Username): Promise<Number> {
        const followerCount = await this.model.countDocuments({ followingUsername: user })
            .catch(err => this.handleDBError(err))
        return followerCount
    }

    async getFollowersList(user: Username): Promise<Username[] | []> {
        const followers = await this.model.find({ followingUsername: user }, { followerUsername: 1 })
            .catch(err => this.handleDBError(err))

        if(!!followers){
            const followersUsername : Username[] = followers.map((follower) => follower.followerUsername)
            return followersUsername
        }

        return []
    }

    async getFollowingCount(user: Username): Promise<Number> {
        const followingCount = await this.model.countDocuments({ followerUsername: user })
            .catch(err => this.handleDBError(err))
        return followingCount
    }

    async getFollowersAndFollowing(user: Username): Promise<followingAndFollowers> {
        // Aggregation for followers
        const followersPipeline = [
            { $match: { followingUsername: user, status: 'accepted' } },
            {
                $lookup: {
                    from: 'follows',
                    localField: 'followerUsername',
                    foreignField: 'followingUsername',
                    as: 'followers'
                }
            },
            {
                $lookup: {
                    from: 'follows',
                    localField: 'followerUsername',
                    foreignField: 'followerUsername',
                    as: 'following'
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'followerUsername',
                    foreignField: 'username',
                    as: 'userData'
                }
            },
            {
                $unwind: '$userData'
            },
            {
                $project: {
                    _id: 0,
                    username: '$followerUsername',
                    imageUrl: '$userData.imageUrl',
                    firstName: '$userData.firstName',
                    lastName: '$userData.lastName',
                    private: '$userData.private',
                    followerCount: { $size: '$followers' },
                    followingCount: { $size: '$following' }
                }
            }
        ];

        const followers = await this.model.aggregate(followersPipeline).exec().catch(err => this.handleDBError(err));

        // Aggregation for following
        const followingPipeline = [
            { $match: { followerUsername: user, status: 'accepted' } },
            {
                $lookup: {
                    from: 'follows',
                    localField: 'followingUsername',
                    foreignField: 'followingUsername',
                    as: 'followers'
                }
            },
            {
                $lookup: {
                    from: 'follows',
                    localField: 'followingUsername',
                    foreignField: 'followerUsername',
                    as: 'following'
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'followingUsername',
                    foreignField: 'username',
                    as: 'userData'
                }
            },
            {
                $unwind: '$userData'
            },
            {
                $project: {
                    _id: 0,
                    username: '$followingUsername',
                    imageUrl: '$userData.imageUrl',
                    firstName: '$userData.firstName',
                    lastName: '$userData.lastName',
                    private: '$userData.private',
                    followerCount: { $size: '$followers' },
                    followingCount: { $size: '$following' }
                }
            }
        ];

        const following = await this.model.aggregate(followingPipeline).exec().catch(err => this.handleDBError(err));

        const followerCount = followers.length;
        const followingCount = following.length;

        return {
            followers,
            following,
            followerCount,
            followingCount,
        };
    }

    async getUserFollowingIds(username: Username): Promise<Username[]> {

        const followings = await this.model.find({ followerUsername: username })
            .select('followingUsername')
            .lean()
            .exec()
            .catch((err) => this.handleDBError(err));

        const followingUsernames = followings.map(follow => follow.followingUsername);

        return followingUsernames;
    }



    async sendFollowRequest(request: followRequest): Promise<Types.ObjectId> {
        const followReq = new this.model({ followerUsername: request.sender, followingUsername: request.receiver, status: 'pending' });
        await followReq.save().catch((err) => this.handleDBError(err));

        return followReq.id
    }

    async acceptOrDeclineFollowRequest(request: followRequestAction): Promise<Types.ObjectId | Boolean> {

        const { sender, receiver, action } = request;

        // Find the follow request
        const followReq = await this.model.findOne({ followerUsername: sender, followingUsername: receiver, status: 'pending' });

        if (!followReq) {
            return false;
        }

        if (action === 'accept') {
            followReq.status = 'accepted';
            await followReq.save().catch(err => this.handleDBError(err));

        } else if (action === 'decline') {
            followReq.status = 'declined';
            await followReq.save().catch(err => this.handleDBError(err));
        }

        return followReq.id;
    }

    // async findOne(query: Partial<followRequestAction & { status?: string }>): Promise<IFollow | null> {
    //     return await this.model.findOne(query).catch((err) => null);
    // }

    async findRequest(followingUsername: Username, followerUsername: Username) {
        const request = await this.model.findOne({
            followingUsername: followingUsername,
            followerUsername: followerUsername,
            status: 'pending'
        }).exec();

        return request || null;
    }


}

