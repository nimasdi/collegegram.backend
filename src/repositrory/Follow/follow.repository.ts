import { Model, Types } from "mongoose";
import { HttpError } from "../../utility/error-handler";
import { IFollow } from "../../db/Follow/follow.model";
import { UserId, Username } from "../../types/user.types";

export interface Follow {
    followingUserName : Username,
    followerUserName : Username,
}

export interface followingAndFollowers {
    followers: { username: Username, followerCount: number, followingCount: number }[];
    following: { username: Username, followerCount: number, followingCount: number }[];
    followerCount: number;
    followingCount: number;
}

export class FollowRepository {

    private model: Model<IFollow>;

    constructor(model: Model<IFollow>) {
        this.model = model;
    }

    private handleDBError = (error : any) => {
        console.log(error)
        throw new HttpError(500,'خطای شبکه رخ داده است.')
    }

    async follow(followerUsername: Username, followingUsername: Username): Promise<void> {
        const user = new this.model({followerUsername, followingUsername});
        await user.save().catch((err) => this.handleDBError(err));
    }

    async unfollow(followerUsername: Username, followingUsername: Username): Promise<void> {
        await this.model.deleteOne({ followingUsername , followerUsername })
        .catch((err) => this.handleDBError(err));
    }
 
    async checkFollow(followerUsername: Username, followingUsername: Username): Promise<Boolean> {
        const followExist = await this.model.findOne({ followingUsername , followerUsername })
        .catch((err) => this.handleDBError(err))

        if (!followExist) {
            return false
        }
        return true
    }

    async getFollowerCount(user: Username): Promise<Number>{
        const followerCount = await this.model.countDocuments({followingUsername: user})
        .catch(err => this.handleDBError(err))
        return followerCount
    }

    async getFollowingCount(user: Username): Promise<Number>{
        const followingCount = await this.model.countDocuments({followerUsername: user})
        .catch(err => this.handleDBError(err))
        return followingCount
    }

    async getFollowersAndFollowing(user: Username): Promise<followingAndFollowers> {
        // Aggregation for followers
        const followersPipeline = [
            { $match: { followingUsername: user } },
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
                    lastName:'$userData.lastName',
                    private: '$userData.private',
                    followerCount: { $size: '$followers' },
                    followingCount: { $size: '$following' }
                }
            }
        ];

        const followers = await this.model.aggregate(followersPipeline).exec().catch(err => this.handleDBError(err));

        // Aggregation for following
        const followingPipeline = [
            { $match: { followerUsername: user } },
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
                    lastName:'$userData.lastName',
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

    async getUserFollowingIds(username: Username): Promise<Types.ObjectId[]> {

        const followings = await this.model.find({ followerUsername: username })
            .select('followingUsername')
            .lean()
            .exec()
            .catch((err) => this.handleDBError(err));

        const followingUserIds = followings.map(follow => follow._id) as Types.ObjectId[];

        return followingUserIds;
    }

    
}

