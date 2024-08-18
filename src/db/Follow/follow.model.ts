import mongoose, { Schema, Document, Model } from 'mongoose';
import { Username } from '../../types/user.types';

// Interface for User attributes
export interface IFollow extends Document {
    followingUserName : Username,
    followerUserName : Username,
}

// Follow Schema
const FollowSchema: Schema<IFollow> = new Schema({
    followingUserName: {
        type: String,
        ref: 'User',
        required: true, 
    },
    followerUserName: {
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

