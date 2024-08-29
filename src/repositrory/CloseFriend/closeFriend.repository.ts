import { Model } from "mongoose";
import { HttpError } from "../../utility/error-handler";
import { IFollow } from "../../db/Follow/follow.model";
import { Username } from "../../types/user.types";

export interface Relation {
    followingUserName: Username,
    followerUserName: Username,
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

}

