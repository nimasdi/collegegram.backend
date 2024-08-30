import { Model } from "mongoose";
import { HttpError } from "../../utility/error-handler";
import { IFollow } from "../../db/Follow/follow.model";
import { Username } from "../../types/user.types";

export interface Relation {
    followingUserName: Username,
    followerUserName: Username,
}

export interface closeFriends {
    closeFriends: { username: Username, followerCount: number, followingCount: number }[];
    closeFriendsCount: number;
}

export class CloseFriendRepository {

    private model: Model<IFollow>;

    constructor(model: Model<IFollow>) {
        this.model = model;
    }

    private handleDBError = (error: any) => {
        console.log(error)
        throw new HttpError(500, 'خطای شبکه رخ داده است.')
    }

    async addCloseFriend(followerUsername: Username, followingUsername: Username): Promise<void> {
        const existFollow = await  this.getFollowRelation(followerUsername, followingUsername)
        if(existFollow === null){
            throw new HttpError(404, "relation not found")
        }

        existFollow.closeFriend = true;
        await existFollow.save().catch((err) => this.handleDBError(err));
    }

    async removeCloseFriend(followerUsername: Username, followingUsername: Username): Promise<void> {
        const existFollow = await  this.getFollowRelation(followerUsername, followingUsername)
        if(existFollow === null){
            throw new HttpError(404, "relation not found")
        }

        existFollow.closeFriend = false;
        await existFollow.save().catch((err) => this.handleDBError(err));
    }
 
    async checkCloseFriend(followerUsername: Username, followingUsername: Username): Promise<Boolean> {
        const existFollow = await this.getFollowRelation(followerUsername, followingUsername)
        console.log(existFollow)
        if(existFollow === null){
            throw new HttpError(404, "relation not found")
        }
        return existFollow.closeFriend || false
    }


    async getFollowRelation(followerUsername: Username, followingUsername: Username): Promise<IFollow | null> {
        const relation = await this.model.findOne({followerUsername, followingUsername , status: 'accepted'})
            .exec().catch((err) => this.handleDBError(err));
        return relation
    }


    async getCloseFriends2(username: Username): Promise<Username[]> {
        const closeFriends = await this.model.find({
            followerUsername: username,
            status: 'accepted',
            closeFriend: true
        }).exec().catch((err) => this.handleDBError(err));

        return closeFriends.map(follow => follow.followingUsername);
    }


    async isCloseFriend(followerUsername: Username, followingUsername: Username): Promise<Boolean> {
        const closeFriends = await this.getCloseFriends2(followerUsername);
        return closeFriends.includes(followingUsername);
    }

    async getCloseFriends(user: Username): Promise<closeFriends> {
        // Aggregation for followers
        const closeFriendsPipeline = [
            { $match: { followerUsername: user , status: 'accepted' , closeFriend: true  } },
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

        const closeFriends = await this.model.aggregate(closeFriendsPipeline).exec().catch(err => this.handleDBError(err));

        const closeFriendsCount = closeFriends.length;

        return {
            closeFriends,
            closeFriendsCount
        };
    }

}

