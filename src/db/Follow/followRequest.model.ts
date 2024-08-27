import mongoose, { Schema, Document, Model } from 'mongoose';
import { Username } from '../../types/user.types';

export interface IFollowRequest extends Document {
    sender: Username,
    receiver: Username,
    status: 'pending' | 'accepted' | 'declined';
}

const FollowRequestSchema: Schema<IFollowRequest> = new Schema({
    sender: {
        type: String,
        ref: 'User',
        required: true,
    },
    receiver: {
        type: String,
        ref: 'User',
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'declined'],
        default: 'pending',
    }
}, {
    timestamps: true,
});

export const FollowRequest: Model<IFollowRequest> = mongoose.model<IFollowRequest>('FollowRequest', FollowRequestSchema);

