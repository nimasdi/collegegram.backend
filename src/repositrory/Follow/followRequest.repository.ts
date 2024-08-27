import { Model } from "mongoose";
import { HttpError } from "../../utility/error-handler";
import { IFollowRequest } from "../../db/Follow/followRequest.model";
import { Username } from "../../types/user.types";

export interface followRequest {
    sender: Username,
    receiver: Username
}

interface followRequestAction {
    sender: string;
    receiver: string;
    action: 'accept' | 'decline';
}

export class FollowRequestRepository {

    private model: Model<IFollowRequest>;

    constructor(model: Model<IFollowRequest>) {
        this.model = model;
    }

    private handleDBError = (error: any) => {
        console.log(error)
        throw new HttpError(500, 'خطای شبکه رخ داده است.')
    }

    async sendFollowRequest(request: followRequest): Promise<void> {
        const followReq = new this.model(request)
        await followReq.save().catch((err) => this.handleDBError(err));
    }

    async acceptOrDeclineFollowRequest(request: followRequestAction): Promise<boolean> {

        const { sender, receiver, action } = request;

        // Find the follow request
        const followReq = await this.model.findOne({ sender, receiver, status: 'pending' });

        if (!followReq) {
            return false;
        }

        if (action === 'accept') {
            followReq.status = 'accepted';
            await followReq.save();

        } else {
            followReq.status = 'declined';
            await followReq.save();
        }

        return true;
    }


}

