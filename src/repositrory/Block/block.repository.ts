import { Model } from "mongoose";
import { HttpError } from "../../utility/error-handler";
import { Username } from "../../types/user.types";
import { IBlock } from "../../db/Block/block.model";

export interface Block {
    blockerUserName : Username,
    blockingUserName : Username,
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

    async block(blockerUserName: Username, blockingUserName: Username): Promise<void> {
        const block = new this.model({blockerUserName, blockingUserName});
        await block.save().catch((err) => this.handleDBError(err));
    }

    async unblock(blockerUserName: Username, blockingUserName: Username): Promise<void> {
        await this.model.deleteOne({ blockerUserName, blockingUserName })
        .catch((err) => this.handleDBError(err));
    }
 
    async checkBlock(blockerUserName: Username, blockingUserName: Username): Promise<Boolean> {
        const BlockExist = await this.model.findOne({ blockerUserName, blockingUserName })
        .catch((err) => this.handleDBError(err))

        if (!BlockExist) {
            return false
        }
        return true
    }
}

