import { Model } from "mongoose";
import { HttpError } from "../../utility/error-handler";
import { Username } from "../../types/user.types";
import { IBlock } from "../../db/Block/block.model";

export interface Block {
    blockerUsername : Username,
    blockingUsername : Username,
}

export class BlockRepository {

    private model: Model<IBlock>;

    constructor(model: Model<IBlock>) {
        this.model = model;
    }

    private handleDBError = (error : any) => {
        console.log(error)
        throw new HttpError(500,'خطای شبکه رخ داده است.')
    }

    async block(blockerUsername: Username, blockingUsername: Username): Promise<void> {
        const block = new this.model({blockerUsername, blockingUsername});
        await block.save().catch((err) => this.handleDBError(err));
    }

    async unblock(blockerUsername: Username, blockingUsername: Username): Promise<void> {
        await this.model.deleteOne({ blockerUsername, blockingUsername })
        .catch((err) => this.handleDBError(err));
    }
 
    async checkBlock(blockerUsername: Username, blockingUsername: Username): Promise<Boolean> {
        const BlockExist = await this.model.findOne({ blockerUsername, blockingUsername })
        .catch((err) => this.handleDBError(err))

        if (!BlockExist) {
            return false
        }
        return true
    }
}

