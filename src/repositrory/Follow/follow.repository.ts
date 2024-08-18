import { Model } from "mongoose";
import { HttpError } from "../../utility/error-handler";
import { IFollow } from "../../db/Follow/follow.model";
import { Username } from "../../types/user.types";

export interface Follow {
    followingUserName : Username,
    followerUserName : Username,
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
 
    async checkFollow(followerUsername: Username, followingUsername: Username): Promise<Boolean> {
        const followExist = await this.model.findOne({ followingUsername , followerUsername })
        .catch((err) => this.handleDBError(err))
        
        if (!followExist) {
            return false
        }
        return true
    }
}

