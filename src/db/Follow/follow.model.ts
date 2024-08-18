import mongoose, { Schema, Document, Model } from 'mongoose';
import { Username } from '../../types/user.types';

// Interface for User attributes
export interface IFollow extends Document {
    followingUsername : Username,
    followerUsername : Username,
}

// Follow Schema
const FollowSchema: Schema<IFollow> = new Schema({
    followingUsername: {
        type: String,
        ref: 'User',
        required: true, 
    },
    followerUsername: {
        type: String,
        ref: 'User',
        required: true, 
    },
}, {
  timestamps: true,
});

FollowSchema.index({ followerUserName: 1, followingUserName: 1 }, { unique: true });

// Follow Model
export const Follow: Model<IFollow> = mongoose.model<IFollow>('Follow', FollowSchema);

