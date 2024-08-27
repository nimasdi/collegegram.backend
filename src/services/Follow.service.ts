import { FollowRequestDto } from "../dto/followRequest.dto";
import { FollowRequestActionDto } from "../dto/followRequestAction.dto";
import { FollowRepository, followingAndFollowers } from "../repositrory/Follow/follow.repository";
import { UserRepository } from "../repositrory/user/user.repositroy";
import { Username } from "../types/user.types";
import { HttpError } from "../utility/error-handler";

export interface followState {
    followerCount: Number,
    followingCount: Number
}

export class FollowService {

    constructor(private followRepo: FollowRepository, private userRepo: UserRepository) {
    }

    async follow(followingUsername: Username, followerUsername: Username): Promise<void> {
        const follwingUserExist = await this.userRepo.getUserByUsername(followingUsername)
        if (!follwingUserExist) {
            throw new HttpError(400, "following not found")
        }
        const existFollow = await this.followRepo.checkFollow(followerUsername, followingUsername)
        if (existFollow) {
            throw new HttpError(400, "user followed before.")
        }
        await this.followRepo.follow(followerUsername, followingUsername)
    }

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

    async checkFollow(followingUsername: Username, followerUsername: Username): Promise<Boolean> {
        const followed = await this.followRepo.checkFollow(followerUsername, followingUsername)
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

        await this.followRepo.sendFollowRequest(followRequestData)
    }


    async acceptOrDeclineFollowRequest(followRequestActionData: FollowRequestActionDto): Promise<boolean> {
        const { receiver, sender, action } = followRequestActionData

        const senderExist = this.userRepo.checkUserExist(sender)
        if (!senderExist) {
            throw new HttpError(404, "user not found")
        }
        const receiverExist = this.userRepo.checkUserExist(receiver)
        if (!receiverExist) {
            throw new HttpError(404, "user not found")
        }

        const followRequest = await this.followRepo.findOne({ sender, receiver, status: 'pending' });
        if (!followRequest) {
            throw new HttpError(400, "Follow request not found or already processed");
        }
            
        // Update the follow request status in the repository
        const result = await this.followRepo.acceptOrDeclineFollowRequest({
            sender,
            receiver,
            action
        });

        return result;

    }


}



