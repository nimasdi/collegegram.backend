import { BlockRepository, blockedUsers } from "../repositrory/Block/block.repository";
import { FollowRepository } from "../repositrory/Follow/follow.repository";
import { UserRepository } from "../repositrory/user/user.repositroy";
import { Username } from "../types/user.types";
import { HttpError } from "../utility/error-handler";

export class BlockService {

    constructor(private blockRepo: BlockRepository, private userRepo: UserRepository , private followRepo: FollowRepository) {
    }

    async block(blockingUsername: Username, blockerUsername: Username): Promise<void> {
        const blockingUserExist = await this.userRepo.getUserByUsername(blockingUsername)
        if (!blockingUserExist) {
            throw new HttpError(400, "blocking user not found")
        }
        const existBlock = await this.blockRepo.checkBlock(blockerUsername, blockingUsername)
        if(existBlock) {
            throw new HttpError(400, "user blocked before.")
        }
        await this.blockRepo.block(blockerUsername, blockingUsername)
        await this.followRepo.removeFollowing(blockerUsername,blockingUsername)
    }

    async unblock(blockingUsername: Username, blockerUsername: Username): Promise<void> {
        const blockingUserExist = await this.userRepo.getUserByUsername(blockingUsername)
        if (!blockingUserExist) {
            throw new HttpError(400, "user not found")
        }
        const existBlock = await this.blockRepo.checkBlock(blockerUsername, blockingUsername)
        if(!existBlock) {
            throw new HttpError(400, "block relation not found")
        }
        await this.blockRepo.unblock(blockerUsername, blockingUsername)
    }

    async checkBlock(blockingUsername: Username, blockerUsername: Username): Promise<Boolean> {
        const blocked = await this.blockRepo.checkBlock(blockerUsername, blockingUsername)
        return blocked
    }

    async getBlockedList(username: Username): Promise<blockedUsers> {
        const blockedUsers = this.blockRepo.getBlockedUserList(username)
        return blockedUsers
    }
}



