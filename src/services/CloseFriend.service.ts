import { CloseFriendRepository } from "../repositrory/CloseFriend/closeFriend.repository";
import { Username } from "../types/user.types";
import { HttpError } from "../utility/error-handler";

export class CloseFriendService {

    constructor(private closeRepo: CloseFriendRepository) {
    }

    async follow(followingUsername: Username, followerUsername: Username): Promise<void> {
        await this.closeRepo.addCloseFriend(followerUsername, followingUsername)
    }

    async unfollow(followingUsername: Username, followerUsername: Username): Promise<void> {
        await this.closeRepo.removeCloseFriend(followerUsername, followingUsername)
    }

    async checkCloseFriend(followingUsername: Username, followerUsername: Username): Promise<Boolean> {
        const closeFriend = await this.closeRepo.checkCloseFriend(followerUsername, followingUsername)
        return closeFriend
    }

}



